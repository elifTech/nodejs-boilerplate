export default
class AbstractEmailController {
  constructor(app) {
    this.app = app;
  }

  setSubject(subject) {
    this.subject = subject;
  }

  getSubject() {
    return this.subject;
  }

  setSenderEmail(senderEmail) {
    this.senderEmail = senderEmail;
  }

  getSenderEmail() {
    return this.senderEmail;
  }

  setEmail(email) {
    this.email = email;
  }

  getEmail() {
    return this.email;
  }
}
