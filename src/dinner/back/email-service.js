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

function valueToString(value) {
  return value.toString();
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
  rawPerson = rawPerson.map(valueToString);
  nextRow = nextRow.map(valueToString);
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
  var nextRowHasItems = !!(nextRow[0].length && nextRow[1].length);
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
  body = successMsg;
  var qr = getPersonQR();
  body = body.concat(qr);
  return body;
}

function getSuccessMessage() {
  return (
    "<p>Reciba de parte de la Universidad del Valle un cálido saludo. " +
    "Su transacción ha sido registrada exitosamente. Es un gusto contar con su asistencia a la Noche de Gala para Egresados 2019. Una oportunidad  para compartir e iniciar las festividades navideñas con la familia univalluna." +
    "<br/>" +
    '<br/> En este email adjuntaremos un código QR, por favor, preséntarlo en las <span style="text-decoration: underline"> mesas de registro</span> al ingreso del evento.' +
    "<br/>" +
    "<br/> Fecha: Viernes 06 de diciembre de 2019." +
    "<br/> Hora: De 7:00 PM a 2:00 AM " +
    "<br/> Lugar: Hotel Dann Carlton Cali, Salón Ritz. " +
    "<br/>" +
    "<br/> Nos vemos pronto." +
    "<br/>" +
    "<br/> <strong>Equipo Organizador</strong>" +
    "<br/> <strong>Noche de Gala Egresados 2019</strong>" +
    "<br/> <strong>Universidad del Valle  </strong></p>"
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
