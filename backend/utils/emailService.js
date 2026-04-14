const SibApiV3Sdk = require('sib-api-v3-sdk');

const client = SibApiV3Sdk.ApiClient.instance;
client.authentications['api-key'].apiKey = process.env.BREVO_API_KEY;

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

// Send email to owner when student contacts
const sendOwnerEmail = async ({ ownerName, ownerEmail, roomTitle, city, price, userName, userEmail, message }) => {
  const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

  sendSmtpEmail.sender = { name: 'SmartStay', email: process.env.ADMIN_EMAIL };
  sendSmtpEmail.to = [{ email: process.env.ADMIN_EMAIL, name: ownerName }];
  sendSmtpEmail.replyTo = { email: userEmail, name: userName };
  sendSmtpEmail.subject = `New Inquiry for "${roomTitle}" on SmartStay`;
  sendSmtpEmail.htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
      <div style="background: linear-gradient(135deg, #ff385c, #e31c5f); padding: 24px; border-radius: 8px 8px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">🏠 SmartStay</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0;">New Property Inquiry</p>
      </div>
      <div style="padding: 24px; background: #f8fafc;">
        <p style="color: #475569; font-size: 15px;">Hi <strong>${ownerName}</strong>,</p>
        <p style="color: #475569; font-size: 15px;">You have received a new inquiry for your property listed on SmartStay.</p>
        
        <div style="background: white; border-radius: 8px; padding: 16px; margin: 16px 0; border-left: 4px solid #ff385c;">
          <h3 style="color: #1e293b; margin: 0 0 8px;">Property Details</h3>
          <p style="margin: 4px 0; color: #475569;"><strong>Room:</strong> ${roomTitle}</p>
          <p style="margin: 4px 0; color: #475569;"><strong>City:</strong> ${city}</p>
          <p style="margin: 4px 0; color: #475569;"><strong>Price:</strong> ₹${price}/month</p>
        </div>

        <div style="background: white; border-radius: 8px; padding: 16px; margin: 16px 0; border-left: 4px solid #3b82f6;">
          <h3 style="color: #1e293b; margin: 0 0 8px;">Student Details</h3>
          <p style="margin: 4px 0; color: #475569;"><strong>Name:</strong> ${userName}</p>
          <p style="margin: 4px 0; color: #475569;"><strong>Email:</strong> ${userEmail}</p>
        </div>

        <div style="background: white; border-radius: 8px; padding: 16px; margin: 16px 0; border-left: 4px solid #22c55e;">
          <h3 style="color: #1e293b; margin: 0 0 8px;">Message</h3>
          <p style="color: #475569; line-height: 1.6;">${message}</p>
        </div>

        <p style="color: #94a3b8; font-size: 13px; margin-top: 24px;">Reply directly to ${userEmail} to respond to this inquiry.</p>
      </div>
      <div style="padding: 16px; text-align: center; color: #94a3b8; font-size: 12px;">
        © 2024 SmartStay · AI-Powered Accommodation Finder
      </div>
    </div>
  `;

  return apiInstance.sendTransacEmail(sendSmtpEmail);
};

// Send confirmation email to student
const sendStudentConfirmation = async ({ userName, userEmail, roomTitle, city, ownerName }) => {
  const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

  sendSmtpEmail.sender = { name: 'SmartStay', email: process.env.ADMIN_EMAIL };
  sendSmtpEmail.to = [{ email: userEmail, name: userName }];
  sendSmtpEmail.subject = `Your inquiry for "${roomTitle}" has been sent!`;
  sendSmtpEmail.htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
      <div style="background: linear-gradient(135deg, #ff385c, #e31c5f); padding: 24px; border-radius: 8px 8px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">🏠 SmartStay</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0;">Inquiry Sent Successfully</p>
      </div>
      <div style="padding: 24px; background: #f8fafc;">
        <p style="color: #475569; font-size: 15px;">Hi <strong>${userName}</strong>,</p>
        <p style="color: #475569; font-size: 15px;">Your inquiry has been sent to <strong>${ownerName}</strong>. They will get back to you soon.</p>
        
        <div style="background: white; border-radius: 8px; padding: 16px; margin: 16px 0; border-left: 4px solid #22c55e;">
          <h3 style="color: #1e293b; margin: 0 0 8px;">✅ Inquiry Summary</h3>
          <p style="margin: 4px 0; color: #475569;"><strong>Property:</strong> ${roomTitle}</p>
          <p style="margin: 4px 0; color: #475569;"><strong>City:</strong> ${city}</p>
          <p style="margin: 4px 0; color: #475569;"><strong>Owner:</strong> ${ownerName}</p>
        </div>

        <p style="color: #475569; font-size: 14px;">While you wait, explore more rooms on SmartStay.</p>
      </div>
      <div style="padding: 16px; text-align: center; color: #94a3b8; font-size: 12px;">
        © 2024 SmartStay · AI-Powered Accommodation Finder
      </div>
    </div>
  `;

  return apiInstance.sendTransacEmail(sendSmtpEmail);
};

module.exports = { sendOwnerEmail, sendStudentConfirmation };


// Send booking notification to owner
const sendBookingOwnerEmail = async ({ ownerName, ownerEmail, roomTitle, city, price, duration, studentName, studentEmail, studentPhone, moveInDate }) => {
  const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
  const totalRent = price * duration;

  sendSmtpEmail.sender = { name: 'SmartStay', email: process.env.ADMIN_EMAIL };
  sendSmtpEmail.to = [{ email: process.env.ADMIN_EMAIL, name: ownerName }];
  sendSmtpEmail.replyTo = { email: studentEmail, name: studentName };
  sendSmtpEmail.subject = `New Booking for "${roomTitle}" on SmartStay`;
  sendSmtpEmail.htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
      <div style="background: linear-gradient(135deg, #22c55e, #16a34a); padding: 24px; border-radius: 8px 8px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">🏠 SmartStay</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0;">🎉 New Room Booking!</p>
      </div>
      <div style="padding: 24px; background: #f8fafc;">
        <p style="color: #475569; font-size: 15px;">Hi <strong>${ownerName}</strong>,</p>
        <p style="color: #475569; font-size: 15px;">Great news! Your room has been booked on SmartStay.</p>

        <div style="background: white; border-radius: 8px; padding: 16px; margin: 16px 0; border-left: 4px solid #22c55e;">
          <h3 style="color: #1e293b; margin: 0 0 8px;">🏠 Room Details</h3>
          <p style="margin: 4px 0; color: #475569;"><strong>Room:</strong> ${roomTitle}</p>
          <p style="margin: 4px 0; color: #475569;"><strong>City:</strong> ${city}</p>
          <p style="margin: 4px 0; color: #475569;"><strong>Rent:</strong> ₹${price.toLocaleString('en-IN')}/month</p>
          <p style="margin: 4px 0; color: #475569;"><strong>Duration:</strong> ${duration} ${duration === 1 ? 'month' : 'months'}</p>
          <p style="margin: 4px 0; color: #16a34a;"><strong>Total Rent:</strong> ₹${totalRent.toLocaleString('en-IN')}</p>
        </div>

        <div style="background: white; border-radius: 8px; padding: 16px; margin: 16px 0; border-left: 4px solid #3b82f6;">
          <h3 style="color: #1e293b; margin: 0 0 8px;">👤 Student Details</h3>
          <p style="margin: 4px 0; color: #475569;"><strong>Name:</strong> ${studentName}</p>
          <p style="margin: 4px 0; color: #475569;"><strong>Email:</strong> ${studentEmail}</p>
          ${studentPhone ? `<p style="margin: 4px 0; color: #475569;"><strong>Phone:</strong> ${studentPhone}</p>` : ''}
          <p style="margin: 4px 0; color: #475569;"><strong>Move-in Date:</strong> ${moveInDate}</p>
        </div>

        <p style="color: #94a3b8; font-size: 13px; margin-top: 24px;">Please contact the student at ${studentEmail} to confirm the booking.</p>
      </div>
      <div style="padding: 16px; text-align: center; color: #94a3b8; font-size: 12px;">
        © 2024 SmartStay · AI-Powered Accommodation Finder
      </div>
    </div>
  `;

  return apiInstance.sendTransacEmail(sendSmtpEmail);
};

// Send booking confirmation to student
const sendBookingStudentEmail = async ({ studentName, studentEmail, roomTitle, city, price, duration, moveInDate, ownerName }) => {
  const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
  const totalRent = price * duration;

  sendSmtpEmail.sender = { name: 'SmartStay', email: process.env.ADMIN_EMAIL };
  sendSmtpEmail.to = [{ email: studentEmail, name: studentName }];
  sendSmtpEmail.subject = `Booking Confirmed: "${roomTitle}" on SmartStay`;
  sendSmtpEmail.htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
      <div style="background: linear-gradient(135deg, #ff385c, #e31c5f); padding: 24px; border-radius: 8px 8px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">🏠 SmartStay</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0;">Booking Confirmed!</p>
      </div>
      <div style="padding: 24px; background: #f8fafc;">
        <p style="color: #475569; font-size: 15px;">Hi <strong>${studentName}</strong>,</p>
        <p style="color: #475569; font-size: 15px;">Your room booking has been confirmed on SmartStay. The owner will contact you soon.</p>

        <div style="background: white; border-radius: 8px; padding: 16px; margin: 16px 0; border-left: 4px solid #ff385c;">
          <h3 style="color: #1e293b; margin: 0 0 8px;">✅ Booking Summary</h3>
          <p style="margin: 4px 0; color: #475569;"><strong>Room:</strong> ${roomTitle}</p>
          <p style="margin: 4px 0; color: #475569;"><strong>City:</strong> ${city}</p>
          <p style="margin: 4px 0; color: #475569;"><strong>Owner:</strong> ${ownerName}</p>
          <p style="margin: 4px 0; color: #475569;"><strong>Move-in Date:</strong> ${moveInDate}</p>
          <p style="margin: 4px 0; color: #475569;"><strong>Duration:</strong> ${duration} ${duration === 1 ? 'month' : 'months'}</p>
          <p style="margin: 4px 0; color: #475569;"><strong>Monthly Rent:</strong> ₹${price.toLocaleString('en-IN')}</p>
          <p style="margin: 4px 0; color: #ff385c; font-size: 16px;"><strong>Total Amount:</strong> ₹${totalRent.toLocaleString('en-IN')}</p>
        </div>

        <p style="color: #475569; font-size: 14px;">The owner will reach out to you to finalize the move-in details.</p>
      </div>
      <div style="padding: 16px; text-align: center; color: #94a3b8; font-size: 12px;">
        © 2024 SmartStay · AI-Powered Accommodation Finder
      </div>
    </div>
  `;

  return apiInstance.sendTransacEmail(sendSmtpEmail);
};

module.exports = { sendOwnerEmail, sendStudentConfirmation, sendBookingOwnerEmail, sendBookingStudentEmail };
