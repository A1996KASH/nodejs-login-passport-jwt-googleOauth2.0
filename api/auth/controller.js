const ErrorHandler = require('../../utils/errorResponse')
const asyncHandler = require('../../middleware/async')


exports.login = asyncHandler(async ({ user }, res, next) => {
    const token = user.getSignedJwtToken()
    res.status(200).json({
      success: true,
      token
    })
  })


  // @desc     Register User
// @route    POST /api/v1/auth/register
// @access   Public
exports.register = asyncHandler(async (req, res, next) => {
    let role = await Roles.findOne({ role: 'users' })
    let org = await Organisations.findOne({ name: 'zeblok' })
    const { name, email, username, password, licenseAccepted } = req.body
    const getUser = await User.findOne().or([{ username }, { email }])
    if (getUser) {
      if (getUser.username === username) return next(new ErrorHandler('Username already registered.', 409))
      if (getUser.email === email) return next(new ErrorHandler('Email already registered.', 409))
    }
    if (req.body.einNumber) {
      const businessPartnerCheck = await Organisations.findOne({ einNumber: req.body.einNumber })
      if (businessPartnerCheck) {
        return next(new ErrorHandler('Business Already Registered with Zeblok!', 409))
      }
    }
    if (req.body.inviteToken) {
      const cryptr = new Cryptr(process.env.SYSTEM_API_SECRET)
      const decryptString = cryptr.decrypt(req.body.inviteToken)
      const data = decryptString.split('+')
      org = await Organisations.findById(data[0]).populate('admin')
      if (org.admin.email === 'superadmin@zeblok.com') {
        role = await Roles.findOne({ role: 'users' })
      } else {
        role = await Roles.findOne({ role: 'orguser' })
      }
    }
    if (!req.body.einNumber && req.body.companyName) {
      role = await Roles.findOne({ role: 'orgadmin' })
      org = await Organisations.create({
        name: req.body.companyName,
        country: req.body.country,
        einNumber: shortid.generate(),
        dbNumber: shortid.generate()
      })
    }
    if (req.body.companyName && req.body.einNumber) {
      role = await Roles.findOne({ role: 'businesspartner' })
      org = await Organisations.create({
        name: req.body.companyName,
        dateOfInc: req.body.dateOfInc,
        einNumber: req.body.einNumber,
        dbNumber: req.body.dbNumber,
        companyType: req.body.companyType,
        businessContactName: req.body.businessContactName,
        billingContactName: req.body.billingContactName,
        salesTurnover: req.body.salesTurnover,
        noOfEmployees: req.body.noOfEmployees,
        noOfBranch: req.body.noOfBranch,
        country: req.body.country
      })
    }
    const organisationId = org._id
    const roleId = role._id
    const user = await User.create({
      name,
      email,
      username,
      password,
      roleId,
      organisationId,
      licenseAccepted
    })
    // org.admin = user._id
    if (req.body.einNumber || req.body.companyName) {
      org.admin = user._id
      await org.save({ validateBeforeSave: false })
    }
    const token = user.getEmailActivationToken()
    await user.save({ validateBeforeSave: false })
    const link = `${process.env.backendUrl}/api/v1/auth/active/${token}`
    const content = `
      Hello ${user.name},<br><br>
      Welcome to Zeblok Computational. Please use the following <a href="${link}">link</a> to complete your registration. It will expire in 1 hour.<br><br>
      <br><br>
      If you did not make this request, please ignore this email.<br><br>
      &mdash; Zeblok Team
    `
    await request({
      method: 'POST',
      url: process.env.mailerUrl,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `apikey=${process.env.mailerApi}&mailto=${user.email}&subject=Verify+your+Zeblok+account+Email+address&message=${content}`
    })
    res.status(201).json({ message: 'Welcome to the Zeblok Computational AI Platform. Please check your email for an account activation link to complete your registration.' })
  })
  