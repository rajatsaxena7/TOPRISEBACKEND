
const { uploadFile } = require("./s3Helper");
const path = require("path");
const PDFDocument = require('pdfkit');

const axios = require('axios');
const { PassThrough } = require('stream');

const generateInvoiceHtml = async (customerDetails, orderId, orderDate, placeOfSupply, placeOfDelivery, items, shippingCharges, totalOrderAmount, invoiceNumber) => {

  //sample data to be passed
  /*
   const customerDetails = {
      name: "John Doe",
      address: "123 Main Street",
      pincode: "12345",
      phone: "123-456-7890",   
      email: "V1d9d@example.com",
  }

  */
  // item details
  /*
  [
{
  productName: "Varasiddhi Silks Men's Formal Shirt (SH-05-42, Navy Blue, 42)",
  sku: "B07KGF3KW8",
  unitPrice: 538.10,
  quantity: 1,
  taxRate: "2.5%",
  cgstPercent: 2.5,
  cgstAmount: 13.45,
  sgstPercent: 2.5,
  sgstAmount: 13.45,
  totalAmount: 565.00
},
{
  productName: "Shipping Charges",
  sku: "SHIP001",
  unitPrice: 30.96,
  quantity: 1,
  taxRate: "2.5%",
  cgstPercent: 2.5,
  cgstAmount: 0.77,
  sgstPercent: 2.5,
  sgstAmount: 0.77,
  totalAmount: 32.50
}
]

  */


  try {

    return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <style>
      body {
        font-family: Arial, sans-serif;
        font-size: 12px;
        color: #000;
      }

      .header {
        text-align: center;
        font-weight: bold;
        font-size: 14px;
        margin-bottom: 10px;
      }

      .logo {
        float: left;
        width: 100px;
      }

      .clearfix {
        clear: both;  
      }

      .section {
        margin: 10px 0;
      }

      .bold {
        font-weight: bold;
      }

      table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 10px;
      }

      th,
      td {
        border: 1px solid #000;
        padding: 4px;
        text-align: left;
      }

      .right {
        text-align: right;
      }

      .center {
        text-align: center;
      }

      .no-border {
        border: none;
      }

      .footer {
        font-size: 10px;
        margin-top: 20px;
      }

      .invoice-summary {
        margin-top: 10px;
      }
    </style>
  </head>
  <body>
    <div class="section">
      <img
        src="https://firebasestorage.googleapis.com/v0/b/lmseducationplaform.appspot.com/o/Media%201.svg?alt=media&token=454fba64-184a-4612-a5df-e473f964daa1"
        class="logo"
        height="100"
      />
      <div style="float: right; text-align: right">
        <div class="bold">Tax Invoice/Bill of Supply/Cash Memo</div>
        <div>(Original for Recipient)</div>
      </div>
    </div>

    <div class="clearfix"></div>

    <div class="section">
      <div style="width: 50%; float: left">
        <div class="bold">Sold By :</div>
        Varasiddhi Silk Exports<br />
        #75, 3rd Cross, Lalbagh Road<br />
        BENGALURU, KARNATAKA, 560027<br />
        IN<br />
        <br />
        <strong>PAN No:</strong> AACFV3325K<br />
        <strong>GST Registration No:</strong> 29AACFV3325K1ZY
      </div>

      <div style="width: 45%; float: right">
        <div class="bold">Billing Address :</div>
        <br>
        ${customerDetails.name}<br />
        ${customerDetails.address}<br />
        ${customerDetails.pincode}<br />
        ${customerDetails.phone}<br />
        INDIA<br />
        <br/>
        <br/>
        <br/>
        <!-- State/UT Code: 29<br /><br /> -->

        <div class="bold">Shipping Address :</div>
        <br>
        ${customerDetails.name}<br />
        ${customerDetails.address}<br />
        ${customerDetails.pincode}<br />
        ${customerDetails.phone}<br />
        INDIA<br />
        <!-- State/UT Code: 29<br /> -->
      </div>
    </div>

    <div class="clearfix"></div>

    <div class="section">
      <strong>Order Number:</strong> ${orderId}<br />
      <strong>Order Date:</strong> ${orderDate}<br />
      <strong>Invoice Number:</strong> ${invoiceNumber}<br />
      <!-- <strong>Invoice Details:</strong> KA-310565025-1920<br /> -->
      <strong>Invoice Date:</strong> ${orderDate}<br />
      <strong>Place of supply:</strong> ${placeOfSupply}<br />
      <strong>Place of delivery:</strong> ${placeOfDelivery}<br />
    </div>

    <table>
      <thead>
        <tr>
          <th>Sl. No</th>
          <th>Description</th>
          <th>Unit Price</th>
          <th>Qty</th>
          <th>Net Amount</th>
          <th>Tax Rate</th>
          <th>Tax Type</th>
          <th>Tax Amount</th>
          <th>Total Amount</th>
        </tr>
      </thead>
      <tbody>
        #items: ${items.length}
        ${items.map((item, index) => {
      return (
        `

        <tr>
          <td>${index + 1}</td>
          <td>
           ${item.productName} (${item.sku})<br />
           
          </td>
          <td class="right">₹${item.unitPrice}</td>
          <td class="center">${item.quantity}</td>
          <td class="right">₹${item.unitPrice * item.quantity}</td></td>
          <td class="center">${item.cgstPercent}</td>
          <td class="center">CGST</td>
          <td class="right">₹${item.cgstAmount}</td>
          <td class="right"></td>
        </tr>
        <tr>
          <td></td>
          <td></td>
          <td class="right"></td>
          <td class="center"></td>
          <td class="right"></td>
          <td class="center">${item.sgstPercent}</td>
          <td class="center">SGST</td>
          <td class="right">₹${item.sgstAmount}</td>
          <td class="right">₹${item.totalAmount}</td>
        </tr>

                    `
      )
    })
      }
       
        <tr>
          <td
            class="right"
            colspan="9"
            style="border-right: 1px solid #000 !important; height: 20px"
          ></td>
        </tr>
        <tr>
          <td></td>
          <td>Shipping Charges</td>
          <td></td>
          <td></td>
          <td class="right">₹${shippingCharges}</td>
          <td></td>
          <td></td>
          <td></td>
          <td class="right">₹${shippingCharges}</td>
        </tr>
       
        <tr>
          <td colspan="8" class="right bold">TOTAL:</td>
          <td class="right bold">₹${totalOrderAmount}</td>
        </tr>
      </tbody>
    </table>

    <div class="section">
    //   <div class="bold">Amount in Words:</div>
    //   {{amountInWords}}<br /><br />
      <!-- <div style="float: right; text-align: right;">
        For Varasiddhi Silk Exports:<br /><br /><br />
        <strong>Authorized Signatory</strong>
      </div> -->
    </div>

    <div class="clearfix"></div>

    <!-- <div class="footer">
      Whether tax is payable under reverse charge - No<br /><br />
      <small>
        *ASPL/ARSPL – Amazon entities. Invoice is not a demand for payment.<br />
        Customers desiring to avail GST input credit must create business accounts and order from Amazon Business.<br />
      </small>
    </div> -->
  </body>
</html>
`;

  } catch (error) {
    console.error("Error generating invoice HTML:", error);
    throw error;
  }
}



const bufferFromStream = async (stream) => {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
};

const generateInvoicePdfBuffer = async (
  customerDetails,
  orderId,
  orderDate,
  placeOfSupply,
  placeOfDelivery,
  items,
  shippingCharges,
  totalOrderAmount,
  invoiceNumber
) => {
  const doc = new PDFDocument({
    margin: 50,
    size: 'A4',
    bufferPages: true // Enable page tracking
  });

  // Register fonts
  doc.registerFont('DejaVu-Bold', path.resolve(__dirname, 'font', 'DejaVuSans-Bold.ttf'));
  doc.font('DejaVu-Bold', path.resolve(__dirname, 'font', 'DejaVuSans-Bold.ttf'));
  doc.registerFont('DejaVu', path.resolve(__dirname, 'font', 'DejaVuSans.ttf'));
  doc.font('DejaVu', path.resolve(__dirname, 'font', 'DejaVuSans.ttf'));

  const stream = new PassThrough();
  doc.pipe(stream);

  // Load logo image
  const imageUrl = 'https://firebasestorage.googleapis.com/v0/b/lmseducationplaform.appspot.com/o/Media%201.png?alt=media&token=ec43244b-eed6-4a25-92a5-9a6694f6b25e';
  let imageBuffer;
  try {
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    imageBuffer = Buffer.from(response.data, 'binary');
  } catch (err) {
    console.warn('⚠️ Could not load logo image, skipping...', err.message);
    imageBuffer = null;
  }

  // Constants for layout
  const pageMargin = 50;
  const rowHeight = 20;
  const lineHeight = 15;
  const colWidths = [30, 130, 60, 40, 60, 50, 50, 60, 60];
  const tableWidth = colWidths.reduce((a, b) => a + b, 0);
  const maxY = 850; // Approximate bottom margin for A4
  let currentPage = 1;

  // Helper function to check page break
  const checkPageBreak = (requiredHeight) => {
    if (doc.y + requiredHeight > maxY) {
      doc.addPage();
      currentPage++;
      doc.y = pageMargin;
      return true;
    }
    return false;
  };

  // Render logo if available
  if (imageBuffer) {
    doc.image(imageBuffer, 40, 45, { width: 80 });
  }

  // Header
  doc.font('DejaVu-Bold').fontSize(16)
    .text('Tax Invoice / Bill of Supply / Cash Memo', 200, 50, { align: 'right' });
  doc.font('DejaVu').fontSize(10)
    .text('(Original for Recipient)', { align: 'right' });

  doc.moveDown(4);

  // Company and Customer Info - Two Column Layout
  const infoY = doc.y;
  const column1X = pageMargin;
  const column2X = 350;

  // Sold By section (Left Column)
  doc.font('DejaVu-Bold').text('Sold By:', column1X, infoY);
  doc.font('DejaVu')
    .text('Varasiddhi Silk Exports', column1X, infoY + lineHeight)
    .text('#75, 3rd Cross, Lalbagh Road', column1X, infoY + lineHeight * 2)
    .text('BENGALURU, KARNATAKA, 560027, IN', column1X, infoY + lineHeight * 3)
    .text('PAN No: AACFV3325K', column1X, infoY + lineHeight * 4)
    .text('GSTIN: 29AACFV3325K1ZY', column1X, infoY + lineHeight * 5)
    .text('', column1X, infoY + lineHeight * 6);

  // Billing Address (Right Column)
  doc.font('DejaVu-Bold').text('Billing Address:', column2X, infoY);
  doc.font('DejaVu')
    .text(customerDetails.name, column2X, infoY + lineHeight)
    .text(customerDetails.address, column2X, infoY + lineHeight * 2)
    .text(customerDetails.pincode, column2X, infoY + lineHeight * 3)
    .text(customerDetails.phone, column2X, infoY + lineHeight * 4)
    .text('INDIA', column2X, infoY + lineHeight * 5)
     .text('', column2X, infoY + lineHeight * 6);


  // Shipping Address (Right Column) - Fixed Y-positions
  doc.font('DejaVu-Bold').text('Shipping Address:', column2X, infoY + lineHeight * 7);
  doc.font('DejaVu')
    .text(customerDetails.name, column2X, infoY + lineHeight * 8)
    .text(customerDetails.address, column2X, infoY + lineHeight * 9)
    .text(customerDetails.pincode, column2X, infoY + lineHeight * 10)
    .text(customerDetails.phone, column2X, infoY + lineHeight * 11)
    .text('INDIA', column2X, infoY + lineHeight * 12);



  // Order By section (Left Column)
  doc.font('DejaVu-Bold').text('Order Details :', column1X, infoY + lineHeight * 7);
  doc.font('DejaVu')
    .text(`Order Number: ${orderId}`, column1X, infoY + lineHeight * 8)
    .text(`Order Date: ${orderDate}`, column1X, infoY + lineHeight * 9)
    .text(`Invoice Number: ${invoiceNumber}`, column1X, infoY + lineHeight * 10)
    .text(`Invoice Date: ${orderDate}`, column1X, infoY + lineHeight * 11)
    .text(`Place of Supply: ${placeOfSupply}`, column1X, infoY + lineHeight * 12)
    .text(`Place of Delivery: ${placeOfDelivery}`, column1X, infoY + lineHeight * 13)
    .text('', column1X, infoY + lineHeight * 14);
    

  doc.y = infoY + lineHeight * 14 + 20;





  // Table Headers
  const drawTableHeaders = () => {
    doc.font('Helvetica-Bold'); // Using a more common font for testing
    const headers = [
      { text: 'Sl. No', align: 'left', width: colWidths[0] },
      { text: 'Description', align: 'left', width: colWidths[1] },
      { text: 'Unit Price', align: 'right', width: colWidths[2] },
      { text: 'Qty', align: 'right', width: colWidths[3] },
      { text: 'Net Amount', align: 'right', width: colWidths[4] },
      { text: 'Tax %', align: 'right', width: colWidths[5] },
      { text: 'Tax Type', align: 'right', width: colWidths[6] },
      { text: 'Tax Amt', align: 'right', width: colWidths[7] },
      { text: 'Total Amt', align: 'right', width: colWidths[8] }
    ];

    // Save current y position for the line
    const lineY = doc.y + rowHeight;
    const initialY = doc.y;
    const headersX = pageMargin;
    headers.forEach((header, i) => {
      doc.y = initialY;
      const currentX = headersX + colWidths.slice(0, i).reduce((a, b) => a + b, 0);

      doc.text(
        header.text,
        currentX,
        doc.y,
        {
          width: colWidths[i],
          align: header.align,
          lineBreak: false // Prevent text from causing row height changes
        }
      );
    });

    // Move to next line after headers
    doc.y = initialY + rowHeight;

    // Draw header underline
    doc.moveTo(pageMargin, lineY)
      .lineTo(pageMargin + tableWidth, lineY)
      .lineWidth(0.5) // Thinner line might look better
      .stroke();

     doc.y = lineY + 10;
  };

  // Draw initial headers
  drawTableHeaders();
  // Helper function to estimate text height
  function getTextHeight(doc, text, width, fontSize = 10, lineHeight = 1.2) {
    const words = text.split(' ');
    let lineCount = 1;
    let currentLineLength = 0;

    words.forEach(word => {
      const wordWidth = doc.widthOfString(word + ' ');
      if (currentLineLength + wordWidth > width) {
        lineCount++;
        currentLineLength = wordWidth;
      } else {
        currentLineLength += wordWidth;
      }
    });

    return lineCount * fontSize * lineHeight;
  }

  // Process items
  items.forEach((item, i) => {
    const netAmount = item.unitPrice * item.quantity;
    const descText = `${item.productName} (${item.sku})`;
    const descHeight = getTextHeight(doc, descText, colWidths[1], 10, 1.2);
    const neededRowHeight = Math.max(descHeight, rowHeight) + 5;
    // Check if we need a new page (2 rows per item + buffer)
    if (checkPageBreak(neededRowHeight * 2 + 40)) {
      drawTableHeaders();
    }

    // Main item row
    const row1Y = doc.y;
    doc.font('DejaVu')
      .text((i + 1).toString(), pageMargin, row1Y, { width: colWidths[0] })
      .text(`${item.productName} (${item.sku})`, pageMargin + colWidths[0], row1Y, {
        width: colWidths[1],
        lineGap: 2
      })
      .text(`₹${item.unitPrice.toFixed(2)}`, pageMargin + colWidths.slice(0, 2).reduce((a, b) => a + b, 0), row1Y, {
        width: colWidths[2],
        align: 'right'
      })
      .text(item.quantity.toString(), pageMargin + colWidths.slice(0, 3).reduce((a, b) => a + b, 0), row1Y, {
        width: colWidths[3],
        align: 'right'
      })
      .text(`₹${netAmount.toFixed(2)}`, pageMargin + colWidths.slice(0, 4).reduce((a, b) => a + b, 0), row1Y, {
        width: colWidths[4],
        align: 'right'
      })
      .text(`${item.cgstPercent}%`, pageMargin + colWidths.slice(0, 5).reduce((a, b) => a + b, 0), row1Y, {
        width: colWidths[5],
        align: 'right'
      })
      .text('CGST', pageMargin + colWidths.slice(0, 6).reduce((a, b) => a + b, 0), row1Y, {
        width: colWidths[6],
        align: 'right'
      })
      .text(`₹${item.cgstAmount.toFixed(2)}`, pageMargin + colWidths.slice(0, 7).reduce((a, b) => a + b, 0), row1Y, {
        width: colWidths[7],
        align: 'right'
      })
      .text('', pageMargin + colWidths.slice(0, 8).reduce((a, b) => a + b, 0), row1Y, {
        width: colWidths[8],
        align: 'right'
      });

    // SGST row
    const row2Y = row1Y + rowHeight;
    doc.font('DejaVu')
      .text('', pageMargin, row2Y, {
        width: colWidths.slice(0, 5).reduce((a, b) => a + b, 0)
      })
      .text(`${item.sgstPercent}%`, pageMargin + colWidths.slice(0, 5).reduce((a, b) => a + b, 0), row2Y, {
        width: colWidths[5],
        align: 'right'
      })
      .text('SGST', pageMargin + colWidths.slice(0, 6).reduce((a, b) => a + b, 0), row2Y, {
        width: colWidths[6],
        align: 'right'
      })
      .text(`₹${item.sgstAmount.toFixed(2)}`, pageMargin + colWidths.slice(0, 7).reduce((a, b) => a + b, 0), row2Y, {
        width: colWidths[7],
        align: 'right'
      })
      .text(`₹${item.totalAmount.toFixed(2)}`, pageMargin + colWidths.slice(0, 8).reduce((a, b) => a + b, 0), row2Y, {
        width: colWidths[8],
        align: 'right'
      });

    // Draw row borders
    // doc.moveTo(pageMargin, row1Y+5 + neededRowHeight * 2)
    //   .lineTo(pageMargin + tableWidth, row1Y + neededRowHeight * 2)
    //   .stroke();

    doc.y = row2Y + neededRowHeight;
  });

  // Shipping and Total
  if (checkPageBreak(rowHeight * 2 + 20)) {
    doc.addPage();
    doc.y = pageMargin;
  }
  doc.y = doc.y + 10;
  // Shipping Charges
  const shippingY = doc.y;
  doc.font('DejaVu-Bold')
    .text('Shipping Charges', pageMargin, shippingY);
  doc.font('DejaVu')
    .text(`₹${shippingCharges.toFixed(2)}`, pageMargin + tableWidth - colWidths[8], shippingY, {
      width: colWidths[8],
      align: 'right'
    });

  // Total
  const totalY = shippingY + rowHeight;
  doc.font('DejaVu-Bold')
    .text('TOTAL:', pageMargin + tableWidth - colWidths[7] - colWidths[8], totalY, {
      width: colWidths[7],
      align: 'right'
    });
  doc.font('DejaVu-Bold')
    .text(`₹${totalOrderAmount.toFixed(2)}`, pageMargin + tableWidth - colWidths[8], totalY, {
      width: colWidths[8],
      align: 'right'
    });
  doc.y = doc.y + 10;
  // Draw final borders
  doc.moveTo(pageMargin, shippingY)
    .lineTo(pageMargin + tableWidth, shippingY)
    .stroke();

  doc.moveTo(pageMargin, totalY + rowHeight)
    .lineTo(pageMargin + tableWidth, totalY + rowHeight)
    .stroke();

  doc.end();
  return await bufferFromStream(stream);
};



exports.generatePdfAndUploadInvoice = async (customerDetails, orderId, orderDate, placeOfSupply, placeOfDelivery, items, shippingCharges, totalOrderAmount, invoiceNumber) => {
  try {
    // const browser = await puppeteer.launch({
    //   headless: "new",
    //   args: ["--no-sandbox", "--disable-setuid-sandbox"],
    // });
    // const page = await browser.newPage();
    // const htmlContent = await generateInvoiceHtml(customerDetails, orderId, orderDate, placeOfSupply, placeOfDelivery, items, shippingCharges, totalOrderAmount, invoiceNumber);


    const pdfBuffer = await generateInvoicePdfBuffer(customerDetails, orderId, orderDate, placeOfSupply, placeOfDelivery, items, shippingCharges, totalOrderAmount, invoiceNumber);

    // await page.setContent(htmlContent, { waitUntil: "networkidle0" });

    // const pdfBuffer = await page.pdf({
    //   format: "A4",
    //   printBackground: true,
    // });

    // await browser.close();
    const fileName = `${orderId}.pdf`;
    const result = await uploadFile(pdfBuffer, fileName, "application/pdf", "invoices");

    return result;

    // return result; // { Location, Key }
  } catch (error) {
    console.error("❌ Error generating/uploading invoice PDF:", error);
    throw new Error("Invoice PDF generation/upload failed");
  }
};
