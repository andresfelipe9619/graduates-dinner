var GENERAL_DB =
  "https://docs.google.com/spreadsheets/d/1108Pbaw4SD_Cpx2xc6Q7x1UvrET0SsPgNNZOPumt9Gg/edit#gid=0";

var SELECTED_PERSON = { data: null, type: null, isApproved: false, row: null };
function onSpreadSheetEdit(e) {
  Logger.log(JSON.stringify(e, null, 4));
  var range = e.range;
  Logger.log("value");
  Logger.log(range.getValue());
  Logger.log("column");
  Logger.log(range.getColumn());
  checkEditedCell(range);
}

function checkEditedCell(range) {
  if (!(range.getColumn() == 11)) return;
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var sheetValues = sheet.getSheetValues(
    range.getRow(),
    1,
    1,
    sheet.getLastColumn()
  );
  var valuesNextRow = sheet.getSheetValues(
    range.getRow() + 1,
    1,
    1,
    sheet.getLastColumn()
  );
  var rawPerson = sheetValues[0];
  var nextRow = valuesNextRow[0];
  Logger.log("range");
  Logger.log(rawPerson);
  rawPerson = rawPerson.map(function(value) {
    return value.toString();
  });
  nextRow = nextRow.map(function(value) {
    return value.toString();
  });
  if (!rawPerson) return;

  SELECTED_PERSON.row = range.getRow();
  SELECTED_PERSON.data = {
    cedula: rawPerson[2],
    nombre: rawPerson[0] + " " + rawPerson[1],
    email: rawPerson[3],
    pago_total: "100000",
    programa: rawPerson[5],
    dependecia: "Cena Egresados 2019",
    celular: rawPerson[4]
  };
  Logger.log("person");
  Logger.log(SELECTED_PERSON);
  var nextRowHasItems = !!(nextRow[0].length > 1 && nextRow[1].length > 1);
  Logger.log("has items below?");
  Logger.log(nextRowHasItems);
  handleOnPaymentChange(range);
}

function handleOnPaymentChange(range) {
  SELECTED_PERSON.type = "PAY";
  if (range.getValue() == "SI") {
    Logger.log("Payment accepted");
    return sendAttendantPayApprovedMail();
  }
  Logger.log("Payment NOT accepted");

  // else if (range.getValue() == "NO") {
  //   sendPayDisapprovedMail();
  // }
}

function getSheetFromSpreadSheet(url, sheet) {
  var Spreedsheet = SpreadsheetApp.openByUrl(url);
  if (url && sheet) return Spreedsheet.getSheetByName(sheet);
}

function sendAttendantPayApprovedMail() {
  Logger.log("Building Email...");
  var htmlBody = buildAttendantPayApprovedBody();
  var subject = "Confirmación de pago Asistente";
  sendEmail(subject, htmlBody);
}

function sendEmail(subject, body) {
  Logger.log("I like the way you french inhale");
  if (SELECTED_PERSON.data) {
    MailApp.sendEmail({
      to: SELECTED_PERSON.data.email,
      subject: subject,
      name: "Cena Egresados 2019",
      htmlBody: body
      // attachments: [],
    });
  }
}

function getPersonQR() {
  var qrserver = "http://api.qrserver.com/v1/create-qr-code/";
  var qrimage =
    " " +
    "<strong>Su ID digital está aquí:</strong><br/>" +
    '<img src="' +
    qrserver +
    "?color=000000&amp;bgcolor=FFFFFF&amp;" +
    "data=" +
    SELECTED_PERSON.data.cedula +
    '&amp;qzone=1&amp;margin=0&amp;size=400x400&amp;ecc=L" alt="qr code" />';
  return qrimage;
}

function buildAttendantPayApprovedBody() {
  var body = "";
  var successMsg = getSuccessMessage();
  // successMsg = successMsg.concat(getLogo());
  body = successMsg;
  var qr = getPersonQR();
  body = body.concat(qr);
  // body = body.concat(getBanner());
  return body;
}

function buildModal(successMsg) {
  var modal =
    '<div class="content">' +
    '<div id="result-msg" class="ui message">' +
    successMsg +
    "</div>" +
    '<form class="ui form not-visible" id="modal-form">' +
    '<div id="pay_info_modal" ' +
    'class="ui medium center aligned inverted header">' +
    '<i class="icon lock"></i>' +
    "<strong>INFORMACIÓN DE PAGO</strong><br/>" +
    "</div>" +
    '<div class="inline field">' +
    "<strong>*NIT o Cédula:  </strong>" +
    "<label>" +
    SELECTED_PERSON.data.cedula +
    "</label>" +
    "</div>" +
    '<div class="inline field">' +
    "<strong>Programa:  </strong>" +
    "<label>" +
    SELECTED_PERSON.data.programa +
    "</label>" +
    "</div>" +
    '<div class="inline field">' +
    "<strong>*Pago Total:  </strong>" +
    "<label>" +
    "$ " +
    SELECTED_PERSON.data.pago_total +
    "(pesos colombianos)" +
    " </label>" +
    "</div>" +
    '<div class="inline field">' +
    "<strong>*Nombre Completo:  </strong>" +
    "<label>" +
    SELECTED_PERSON.data.nombre +
    " </label>" +
    "</div>" +
    '<div class="inline field">' +
    "<strong>*Dependencia:  </strong>" +
    "<label>" +
    SELECTED_PERSON.data.dependecia +
    "</label>" +
    "</div>" +
    '<div class="inline field">' +
    "<strong>Télefono de Contacto:  </strong>" +
    "<label>" +
    SELECTED_PERSON.data.celular +
    " </label>" +
    "</div>" +
    "<br />" +
    '<div class="actions">' +
    '<button style="color:red">' +
    '<a href="https://www.psepagos.co/PSEHostingUI/ShowTicketOffice.aspx?ID=4111">' +
    "<h2>Generar pago</h2>" +
    "</a></button>" +
    "</div>" +
    "</form>" +
    "</div>";

  return modal;
}

function getSuccessMessage() {
  return (
    "<p>Cordial saludo " +
    SELECTED_PERSON.data.nombre +
    ", bienvenido a Cena Egresados 2019 el mejor evento de Cali." +
    '<br/> En este email adjuntaremos un código QR, por favor, preséntarlo en las <span style="text-decoration: underline"> mesas de registro</span> al ingreso del evento, allí le entregarán su escarapela de ingreso,' +
    'requerida para ingresar a las conferencias y otros servicios del evento, de igual manera es <span style="text-decoration: underline">la única forma </span> de obtener su certificado como ponente/asistente.</p>'
  );
}
function getLogo() {
  return (
    "<strong>Haga clic en el logo para conocer la agenda:</strong><br/>" +
    '<a href="http://www.cogestec.co/agenda/"><img src="http://www.cogestec.co/wp-content/uploads/2018/11/Logo-3.png" ' +
    'width = "180px" height = "90px" /></a><br/>'
  );
}
function getBanner() {
  return (
    "<br/><strong>¡Sigue nuestras redes sociales y comunica tu vínculo directo con la innovación</strong><br/>" +
    '<a href="http://www.cogestec.co/agenda/"><img src="https://drive.google.com/uc?id=1W0p2HZt_NfV0bvkA12iMSwQh-K2aOizD"/></a>'
  );
}
