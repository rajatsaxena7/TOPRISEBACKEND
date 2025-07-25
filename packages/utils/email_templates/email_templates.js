

exports.welcomeEmail = async (firstName, email, password, loginUrl, companyPhone, companyEmail, companyUrl) => {

    return (`
     <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Toprise Ventures Welcome Email</title>
    <link
      href="https://fonts.googleapis.com/css2?family=Red+Hat+Display:wght@400;500;700&display=swap"
      rel="stylesheet"
    />
    <style>
      body {
        font-family: "Red Hat Display", Arial, sans-serif;
        line-height: 1.6;
        color: #333;
        max-width: 800px;
        margin: 0 auto;
        padding: 20px;
      }

      .welcome-banner {
        background-image: url("https://firebasestorage.googleapis.com/v0/b/lmseducationplaform.appspot.com/o/Rectangle%201.svg?alt=media&token=632f2d54-aa7d-4e3c-a03c-e94e00c41244");
        /* background-color: #f5f5f5; */
        padding: 15px;
        text-align: center;
        margin-bottom: 20px;
        font-weight: bold;
        display: flex;
        flex-direction: column;
        height: fit-content;
        border-bottom-left-radius: 8px;
        border-bottom-right-radius: 8px;
        padding-left: 10px;
        padding-right: 10px;
        /* margin-left: 15px;
        margin-right: 15px; */
      }
      .header {
        text-align: center;
        margin-bottom: 30px;
      }

      .logo {
        font-size: 24px;
        font-weight: bold;
        margin-bottom: 5px;
      }

      .logo-sub {
        font-size: 18px;
        font-weight: normal;
        margin-top: 0;
      }
      .title {
        font-size: 34px;
        font-weight: 800;
      }

      .subtitle {
        font-size: 18px;
        font-weight: 800;
        margin-bottom: 20px;
      }
      .mailContent {
        margin-top: 80px;
        /* margin-left: 80px; */
      }

      .greeting {
        font-size: 18px;
        font-weight: 800;
        line-height: 34px;
        margin-bottom: 20px;
      }

      .credentials {
        padding: 15px;
        margin-bottom: 20px;
        font-size: 18px;
      }

      .credentials p {
        margin: 5px 0;
        font-size: 18px;
      }
      .table-label {
        font-weight: 600;
        color: #6a6a6a;
         font-size: 14px;
        padding-right: 80px;
      }
      .table-value {
        font-weight: 800;
        color: red;
        font-size: 14px;
        text-align: right;
      }

      .action {
        font-weight: 700;
        font-size: 18px;
        line-height: 32px;
      }

      .support {
        font-weight: 700;
        font-size: 18px;
        line-height: 32px;
      }

      .registration-form {
        margin-top: 30px;
        padding-top: 20px;
        font-weight: 700;
        font-size: 18px;
        line-height: 32px;
      }

      .registration-form p {
        font-weight: 700;
        font-size: 18px;
        line-height: 32px;
      }

      .footer {
        background-image: url("https://firebasestorage.googleapis.com/v0/b/lmseducationplaform.appspot.com/o/Rectangle%202.svg?alt=media&token=ee6db30e-953f-4a4f-a1f0-895c68c9ba70");
        text-align: center;
        margin-top: 40px;
        font-weight: 700;
        font-size: 18px;
        line-height: 32px;
        height: 70px;
        border-top-left-radius: 8px;
        border-top-right-radius: 8px;
        padding-left: 10px;
        padding-right: 10px;
        /* margin-left: 15px;
        margin-right: 15px; */
        display: flex;
        align-items: center;
        justify-content: center;
      }
    </style>
  </head>
  <body>
    <div class="welcome-banner">
      <div class="header">
        <div class="logo">
          <img
            src="https://firebasestorage.googleapis.com/v0/b/lmseducationplaform.appspot.com/o/Media%201.svg?alt=media&token=454fba64-184a-4612-a5df-e473f964daa1"
            alt=""
          />
        </div>
      </div>
      <div class="logoTilte">
        <div class="title">Welcome to Toprise</div>
        <div class="subtitle">Your Account Credentials Inside</div>
      </div>
    </div>
    <div class="mailContent">
      <div class="greeting">
        Hi ${firstName},<br />
        Welcome to Toprise We're excited to have you onboard.
      </div>

      <div class="credentials">
        <table>
          <tr>
            <td class="table-label">Email:</td>
            <td class="table-value">${email}</td>
          </tr>
          <tr>
            <td class="table-label">Temporary Password:</td>
            <td class="table-value">${password}</td>
          </tr>
          <tr>
            <td class="table-label">Login URL:</td>
            <td class="table-value"><a href="${loginUrl}">${loginUrl}</a></td>
          </tr>
        </table>
      </div>

      <div class="action">
        For security purposes, please login and change your password at your
        earliest convenience.
      </div>

      <div class="support">
        If you need any help getting started, feel free to reach out to our
        support team at [burgen@spostcompany.com]<br />
        Once again, welcome to the [Company Name] family. We're glad you're
        here!
      </div>

      <div class="registration-form">
        <p>Best regards,</p>
        <p>Toprise Team</p>
        <p>Toprise</p>
        <p>${companyPhone} | ${companyEmail} | ${companyUrl}</p>
      </div>
    </div>

    <div class="footer">Toprise © copyright<br /></div>
  </body>
</html>



`
    )
};

exports.orderShippingMail = (orderId, firstName, email, password, loginUrl, shippigMethod, estimated_deliveryDate, orderItems,supportEmail) => {
    //  <div class="card">
    //       <img
    //         src="https://cdn.pixabay.com/photo/2016/09/22/10/44/banner-1686943_1280.jpg"
    //         alt="Product 1"
    //       />
    //       <div class="card-content">
    //         <h3 class="card-title">${productName}</h3>
    //         <h4 class="card-subtitle">${manufacture}</h4>
    //         <span class="cardPrice">
    //           <p class="card-price">${amount}</p>
    //           <p class="card-priceOrginal"><strike>${mrp_withgst}</strike></p>
    //         </span>

    //         <p class="card-date">${new Date(date).toDateString()}</p>
    //       </div>
    //     </div>
    return (
        `
         <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Order Confirmation</title>
    <link
      href="https://fonts.googleapis.com/css2?family=Red+Hat+Display:wght@400;500;700&display=swap"
      rel="stylesheet"
    />
    <style>
      body {
        font-family: "Red Hat Display", Arial, sans-serif;
        line-height: 1.6;
        color: #333;
        max-width: 800px;
        margin: 0 auto;
        padding: 20px;
      }

      .welcome-banner {
        /* background-image: url("https://cdn.pixabay.com/photo/2016/09/22/10/44/banner-1686943_1280.jpg"); */
        /* background-color: #f5f5f5; */
        padding: 15px;
        text-align: center;
        margin-bottom: 20px;
        font-weight: bold;
        display: flex;
        flex-direction: column;
        height: fit-content;
        border-bottom-left-radius: 8px;
        border-bottom-right-radius: 8px;
        padding-left: 10px;
        padding-right: 10px;
        margin-left: 15px;
        margin-right: 15px;
      }
      .header {
        text-align: center;
        margin-bottom: 30px;
      }

      .logo {
        font-size: 24px;
        font-weight: bold;
        margin-bottom: 5px;
      }

      .logo-sub {
        font-size: 18px;
        font-weight: normal;
        margin-top: 0;
      }
      .logo-sub img{
       width:220px
      }
      .title {
        font-size: 34px;
        font-weight: 800;
      }

      .subtitle {
        font-size: 18px;
        font-weight: 800;
        margin-bottom: 20px;
      }
      .orderinfo{
        font-size: 18px;
        font-weight: 800
      }
      .mailContent {
        margin-top: 80px;
        /* margin-left: 40px; */
      }

      .greeting {
        font-size: 18px;
        font-weight: 800;
        line-height: 34px;
        margin-bottom: 20px;
      }

      .credentials {
        padding: 15px;
        margin-bottom: 20px;
        font-size: 18px;
      }

      .credentials p {
        margin: 5px 0;
        font-size: 18px;
      }
      .table-label {
        font-weight: 600;
        color: #6a6a6a;
        padding-right: 80px;
      }
      .table-value {
        font-weight: 800;
        color: red;
        text-align: right;
      }
      /* Grid container: 3 columns, auto-wrap to new rows */
      .card-grid {
        display: grid;
        grid-template-columns: repeat(1, 1fr);
        gap: 20px; /* space between cards */
        max-width: 1200px;
        margin: 40px auto; /* center on page */
        padding: 0 20px;
      }

      /* Card itself */
      .card {
        background: #ffffff;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        display: flex;
        flex-direction: row;
        padding: 10px;
        align-items: center;
      }

      /* Image stretches full-width */
      .card img {
        border: 1px solid #e0e0e0;
        border-radius: 10%;
        padding: 5px;
        height: 80px !important;
        width: 85px;
        height: auto;
        display: block;
      }

      /* Inner padding & typography */
      .card-content {
        padding: 16px;
        flex: 1;
      }

      .card-title {
        margin: 0 0 0px;
        font-size: 14px;
        color: #333333;
      }
      .card-subtitle {
        margin: 0 0 8px;
        color: #777777;
        font-size: 14px;
      }
      .cardPrice {
        display: flex;
        justify-content: left;
        gap: 10px;
        align-items: center;
      }

      .card-price {
        margin: 0;
        font-size: 14px;
        font-weight: 700;
        /* color: #d63384; */
        font-weight: bold;
      }
      .card-priceOrginal {
        margin: 0;
        font-size: 14px;
        font-weight: 400;
        color: #777777;
        font-weight: bold;
      }

      .card-date {
        margin: 4px 0 0;
        font-size: 12px;
        font-weight: 500;
        color: #777777;
      }

      /* Responsive breakpoints (optional) */
      @media (max-width: 900px) {
        .card-grid {
          grid-template-columns: repeat(1, 1fr);
        }
      }

      @media (max-width: 600px) {
        .card-grid {
          grid-template-columns: 1fr;
        }
      }

      .action {
        font-weight: 700;
        font-size: 18px;
        line-height: 32px;
      }

      .support {
        font-weight: 700;
        font-size: 18px;
        line-height: 32px;
      }

      .delivery-method {
        margin-top: 25px;
        padding-top: 15px;
        border-top: 1px solid #eee;
      }

      .delivery-title {
        font-weight: bold;
        margin-bottom: 10px;
      }
      .support-link {
        margin-top: 20px;
        font-size: 14px;
      }

      .company-name {
        font-weight: bold;
        color: #000;
      }

      .footer {
        background-color: red;
        color: white;
        text-align: center;
        margin-top: 40px;
        font-weight: 700;
        font-size: 18px;
        line-height: 32px;
        height: 70px;
        border-top-left-radius: 8px;
        border-top-right-radius: 8px;
        padding-left: 10px;
        padding-right: 10px;
        /* margin-left: 15px;
        margin-right: 15px; */
        display: flex;
        align-items: center;
        justify-content: center;
      }
    </style>
  </head>
  <body>
    <div class="welcome-banner">
      <div class="header">
        <div class="logo">
          <img src="https://firebasestorage.googleapis.com/v0/b/lmseducationplaform.appspot.com/o/Media%201.svg?alt=media&token=454fba64-184a-4612-a5df-e473f964daa1" alt="">
        </div>
        <div class="logo-sub">
          <img src="https://firebasestorage.googleapis.com/v0/b/lmseducationplaform.appspot.com/o/Illustration.svg?alt=media&token=61b9c1f4-d334-4004-80a7-c47f748fa4a2" alt="">
        </div>
      </div>
     
      <div class="orderinfo">
        <p>Your Order #${orderId} Details from Toprise</p>
      </div>
    </div>
    <div class="mailContent">
      <div class="greeting">
        Hi ${firstName},<br />
        Thank you for your order! We’re excited to get your items ready. Below
        are your order details:
      </div>

      <div class="credentials">
        <table>
          <tr>
            <td class="table-label">Email:</td>
            <td class="table-value">${email}</td>
          </tr>
          <tr>
            <td class="table-label">Temporary Password:</td>
            <td class="table-value">${password}/pv22584</td>
          </tr>
          <tr>
            <td class="table-label">Login URL:</td>
            <td class="table-value"><a href="${loginUrl}">${loginUrl}</a></td>
          </tr>
        </table>
      </div>
      <div class="card-grid">
      ${orderItems &&
        orderItems.map(
            (item) =>
                `<div class="card">
          <img
            src="${item.productImage}"
            alt="Product 1"
          />
          <div class="card-content">
            <h3 class="card-title">${item.productName}</h3>
            <h4 class="card-subtitle">${item.manufacture}</h4>
            <span class="cardPrice">
              <p class="card-price">${item.amount}</p>
              <p class="card-priceOrginal"><strike>${item.mrp_withgst}</strike></p>
            </span>

            <p class="card-date">${new Date(item.date).toDateString()}</p>
          </div>
        </div>`
        )
        }
       
      </div>

      <div class="delivery-method">
        <div class="delivery-title">
          🚚 Shipping Method: ${shippigMethod}
        </div>
        <p>Estimated delivery: ${new Date(estimated_deliveryDate).toDateString()}</p>
        <p>You'll receive a tracking link once your order is shipped.</p>

        <div class="support-link">
          If you have any questions, feel free to reply to this email or contact
          us at <a href="mailto:${supportEmail}">${supportEmail}</a>.
        </div>

        <p>
          Thanks for shopping with
          <span class="company-name">Toprise</span>
        </p>
      </div>
    </div>

    <div class="footer">Toprise © copyright<br /></div>
  </body>
</html>
`
    )
}

exports.orderConfirmationEmail = (firstName,  orderId,     orderItems,returnAddressLine1,returnCity,returnState,returnZipCode,supportPhone,supportEmail,companyName,yourName,yourTitle,contactInfo)=>{

    return(
        `
       <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Order Return</title>
    <link
      href="https://fonts.googleapis.com/css2?family=Red+Hat+Display:wght@400;500;700&display=swap"
      rel="stylesheet"
    />
    <style>
      body {
        font-family: "Red Hat Display", Arial, sans-serif;
        line-height: 1.6;
        color: #333;
        max-width: 800px;
        margin: 0 auto;
        padding: 20px;
      }

      .welcome-banner {
        /* background-image: url("https://cdn.pixabay.com/photo/2016/09/22/10/44/banner-1686943_1280.jpg"); */
        /* background-color: #f5f5f5; */
        padding: 15px;
        text-align: center;
        margin-bottom: 20px;
        font-weight: bold;
        display: flex;
        flex-direction: column;
        height: fit-content;
        border-bottom-left-radius: 8px;
        border-bottom-right-radius: 8px;
        padding-left: 10px;
        padding-right: 10px;
        margin-left: 15px;
        margin-right: 15px;
      }
      .header {
        text-align: center;
        margin-bottom: 30px;
      }

      .logo {
        font-size: 24px;
        font-weight: bold;
        margin-bottom: 5px;
      }

      .logo-sub {
        font-size: 18px;
        font-weight: normal;
        margin-top: 0;
      }
       .logo-sub img {
         width:220px;
       }
      .title {
        font-size: 34px;
        font-weight: 800;
      }

      .subtitle {
        font-size: 18px;
        font-weight: 800;
        margin-bottom: 20px;
      }
      .orderinfo{
        font-size: 18px;
        font-weight: 800
      }
      .mailContent {
        margin-top: 80px;
        /* margin-left: 40px; */
      }

      .greeting {
        font-size: 18px;
        font-weight: 800;
        line-height: 34px;
        margin-bottom: 20px;
      }

      .credentials {
        padding: 15px;
        margin-bottom: 20px;
        font-size: 18px;
      }

      .credentials p {
        margin: 5px 0;
        font-size: 18px;
      }
      .table-label {
        font-weight: 600;
        color: #6a6a6a;
        padding-right: 80px;
      }
      .table-value {
        font-weight: 800;
        color: red;
        text-align: right;
      }
      /* Grid container: 3 columns, auto-wrap to new rows */
      .card-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 20px; /* space between cards */
        max-width: 1200px;
        margin: 40px auto; /* center on page */
        padding: 0 20px;
      }

      /* Card itself */
      .card {
        background: #ffffff;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        display: flex;
        flex-direction: row;
        padding: 10px;
        align-items: center;
      }

      /* Image stretches full-width */
      .card img {
        border: 1px solid #e0e0e0;
        border-radius: 10%;
        padding: 5px;
        height: 80px !important;
        width: 85px;
        height: auto;
        display: block;
      }

      /* Inner padding & typography */
      .card-content {
        padding: 16px;
        flex: 1;
      }

      .card-title {
        margin: 0 0 0px;
        font-size: 14px;
        color: #333333;
      }
      .card-subtitle {
        margin: 0 0 8px;
        color: #777777;
        font-size: 14px;
      }
      .cardPrice {
        display: flex;
        justify-content: left;
        gap: 10px;
        align-items: center;
      }

      .card-price {
        margin: 0;
        font-size: 14px;
        font-weight: 700;
        /* color: #d63384; */
        font-weight: bold;
      }
      .card-priceOrginal {
        margin: 0;
        font-size: 14px;
        font-weight: 400;
        color: #777777;
        font-weight: bold;
      }

      .card-date {
        margin: 4px 0 0;
        font-size: 12px;
        font-weight: 500;
        color: #777777;
      }

      /* Responsive breakpoints (optional) */
      @media (max-width: 900px) {
        .card-grid {
          grid-template-columns: repeat(2, 1fr);
        }
      }

      @media (max-width: 600px) {
        .card-grid {
          grid-template-columns: 1fr;
        }
      }

      .return-section {
        margin-top: 25px;
        padding-top: 15px;
        border-top: 1px solid #eee;
        font-size: 18px;
        font-weight: 800;
      }

      .return-title {
        font-weight: bold;
        margin-bottom: 15px;
       font-size: 18px;
        font-weight: 800;
      }
      
      .return-address {
        background-color: #f9f9f9;
        padding: 15px;
        border-radius: 8px;
        margin: 15px 0;
        font-size: 18px;
        font-weight: 800;
        line-height: 1.6;
      }
      
      .return-instructions {
        margin: 15px 0;
      font-size: 18px;
        font-weight: 800;
        line-height: 1.6;
      }

      .support-link {
        margin-top: 20px;
        font-size: 18px;
        font-weight: 800;
      }

      .company-name {
        font-weight: bold;
        color: #000;
      }

      .signature {
        margin-top: 20px;
       font-size: 18px;
        font-weight: 800;
        line-height: 1.6;
      }
      

      .company-name {
        font-weight: bold;
        color: #000;
      }

      .footer {
        background-color: red;
        color: white;
        text-align: center;
        margin-top: 40px;
        font-weight: 700;
        font-size: 18px;
        line-height: 32px;
        height: 70px;
        border-top-left-radius: 8px;
        border-top-right-radius: 8px;
        padding-left: 10px;
        padding-right: 10px;
        /* margin-left: 15px;
        margin-right: 15px; */
        display: flex;
        align-items: center;
        justify-content: center;
      }
    </style>
  </head>
  <body>
    <div class="welcome-banner">
      <div class="header">
        <div class="logo">
          <img src="https://firebasestorage.googleapis.com/v0/b/lmseducationplaform.appspot.com/o/Media%201.svg?alt=media&token=454fba64-184a-4612-a5df-e473f964daa1" alt="">
        </div>
        <div class="logo-sub">
          <img src="https://firebasestorage.googleapis.com/v0/b/lmseducationplaform.appspot.com/o/571Y_890mishd95fk4tbj5kp3enqkc5m6ab9g70%201.svg?alt=media&token=d0c68512-496d-427c-a95e-b721c5b26477" alt="">
        </div>
      </div>
      
      <div class="orderinfo">
        <p>Your Order #${orderId} Details from Toprise</p>
      </div>
    </div>
    <div class="mailContent">
      <div class="greeting">
        Hi ${firstName},<br />
        Thank you for your order! We’re excited to get your items ready. Below
        are your order details:
      </div>

      // <div class="credentials">
      //   <table>
      //     <tr>
      //       <td class="table-label">Email:</td>
      //       <td class="table-value">${email}</td>
      //     </tr>
      //     <tr>
      //       <td class="table-label">Temporary Password:</td>
      //       <td class="table-value">${password}/pv22584</td>
      //     </tr>
      //     <tr>
      //       <td class="table-label">Login URL:</td>
      //       <td class="table-value"><a href="${loginUrl}">${loginUrl}</a></td>
      //     </tr>
      //   </table>
      // </div>
      <div class="card-grid">
         ${orderItems &&
        orderItems.map(
            (item) =>
                `<div class="card">
          <img
            src="${item.productImage}"
            alt="Product 1"
          />
          <div class="card-content">
            <h3 class="card-title">${item.productName}</h3>
            <h4 class="card-subtitle">${item.manufacture}</h4>
            <span class="cardPrice">
              <p class="card-price">${item.amount}</p>
              <p class="card-priceOrginal"><strike>${item.mrp_withgst}</strike></p>
            </span>

            <p class="card-date">${new Date(item.date).toDateString()}</p>
          </div>
        </div>`
        )
        }
       

      </div>

       <div class="return-section">
        <div class="return-title">Return Instructions:</div>
        
        <div class="return-instructions">
          If your return is approved and requires shipping, please send the items to:
        </div>
        
        <div class="return-address">
          <strong>${returnAddressLine1}</strong><br>
          ${returnCity}, ${returnState} ${returnZipCode}<br>
          <strong>Phone:</strong> ${supportPhone}
        </div>
        
        <div class="return-instructions">
          Make sure items are packed securely and include the original invoice inside.
        </div>
        
        <div class="support-link">
          If you have any questions or need assistance, feel free to reply to this email or contact our support team at <a href="mailto:${supportEmail}">${supportEmail}</a>.
        </div>
      </div>
      
      <div class="signature">
        Thank you for shopping with ${companyName},<br><br>
        Warm regards,<br>
        ${yourName}<br>
        ${yourTitle}<br>
        ${companyName}<br>
        ${contactInfo}
      </div>
    </div>
    </div>

    <div class="footer">Toprise © copyright<br /></div>
  </body>
</html>

        `
    )
}