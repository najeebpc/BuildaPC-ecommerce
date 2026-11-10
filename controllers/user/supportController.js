const { sendContactEmail } = require('../../helpers/mailHelper');
const loadContact = (req, res) => {
  res.render('user/contact', {
    user: req.session.user,
    success: req.query.success === 'true',
    error: req.query.error || null,
  });
};
const submitContact = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !subject || !message) {
      return res.redirect('/contact?error=required');
    }
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email.trim())) {
      return res.redirect('/contact?error=invalidEmail');
    }
    const success = await sendContactEmail({
      name: name.trim(),
      email: email.trim(),
      subject: subject.trim(),
      message: message.trim(),
    });
    if (!success) {
      return res.redirect('/contact?error=emailFailed');
    }

    return res.redirect('/contact?success=true');
  } catch (error) {
    console.log('Contact form error:', error);
    return res.redirect('/contact?error=serverError');
  }
};
module.exports = {
  loadContact,
  submitContact,
};
