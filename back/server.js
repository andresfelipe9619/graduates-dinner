const PROGRAMAS =
  "https://docs.google.com/spreadsheets/d/1JBq9HT1yLVKGmpiB6fpOc6Lf0kqoZBziya0M5_dTjbo/edit?usp=sharing";

function doGet(request) {
  return HtmlService.createTemplateFromFile("front/index.html")
    .evaluate() // evaluate MUST come before setting the Sandbox mode
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function searchPerson (cedula) {
  let person = validatePerson(cedula)
  logFunctionOutput(searchPerson.name, person)
  return person
}

function getEntityData (entity, url) {
  const rawEntities = getRawDataFromSheet(entity, url)
  const entities = sheetValuesToObject(rawEntities)
  return entities
}

function getPrograms () {
  return getEntityData('PROGRAMAS', PROGRAMAS)
}

function getPeopleRegistered () {
  return getEntityData('INSCRITOS')
}

function getPeopleRegisteredSheet () {
  const sheet = getSheetFromSpreadSheet('INSCRITOS')
  const headers = getHeadersFromSheet(sheet)
  return { sheet, headers }
}

function getFacultiesAndPrograms () {
  let result = {
    faculties: null,
    programs: null
  }
  let programs = getPrograms()
  let lastPrograms = []
  let esta = false

  programs.forEach(program => {
    esta = lastPrograms.find(
      last => String(program.nombre) === String(last.nombre)
    )
    if (!esta) lastPrograms.push(program)
  })
  result.faculties = getFacultiesFromPrograms(programs)
  result.programs = lastPrograms
  //logFunctionOutput(getFacultiesAndPrograms.name, result)
  return result
}

function getFacultiesFromPrograms (programs) {
  let faculties = programs.reduce((acc, program) => {
    if (acc.indexOf(program.facultad) < 0) {
      Logger.log('FACULTAD QUE NO ESTA')
      Logger.log(program.facultad)
      acc.push(program.facultad)
    }
    return acc
  }, [])
  return faculties
}

function validatePerson (cedula) {
  let { sheet, headers } = getPeopleRegisteredSheet()
  let result = {
    isRegistered: false,
    index: -1,
    data: null
  }
  const { index } = findText({ sheet, text: cedula })
  console.log(`Cedula: `, cedula)
  console.log(`Index: `, index)
  result.index = index
  logFunctionOutput(validatePerson.name, result)
  if (result.index === -1) {
    result.isRegistered = false
    return result
  }
  const entityRange = sheet.getSheetValues(+index, 1, 1, sheet.getLastColumn())
  Logger.log(`${cedula} Range: ${entityRange.length}`)
  Logger.log(entityRange)
  const [entityData] = sheetValuesToObject(entityRange, headers)
  Logger.log(`${cedula} Data:`)
  Logger.log(entityData)
  result.isRegistered = true
  result.data = entityData
  return result
}

function registerDinner(person, invited) {
  let { sheet, headers } = getPeopleRegisteredSheet()
  var index = person.index;
  var data = person.data;
  Logger.log(index);
  Logger.log(data);
  var entryIndex = headers.indexOf("HORA_INGRESO");
  var today = new Date()
  var entryHour = String(today);
  data["nota"] = "";
  data["timestamp"] = entryHour;
  data["hora_ingreso"] = today.getHours();
  data["invitados_especiales"] = "";
  data["acompañante"] = invited === "NO" ? "NO" : "SI";
  Logger.log(entryIndex);
  Logger.log(index);
  logFunctionOutput(
    registerDinner.name,
    sheet.getRange(index + 1, entryIndex + 1, 1, 1).getValues()
  );
  sheet
    .getRange(index + 1, entryIndex + 1, 1, 1)
    .setValues([[entryHour]]);

  registerAttendee(data);
  return true;
}

function registerAttendee(person) {
  var inscritosSheet = getSheetFromSpreadSheet(GENERAL_DB, "ASISTENTES");
  var headers = getHeadersFromSheet(inscritosSheet);
  var personValues = jsonToSheetValues(person, headers);
  var finalValues = personValues.map(function(value) {
    return String(value);
  });

  inscritosSheet.appendRow(finalValues);
  var result = { data: finalValues, ok: true };
  logFunctionOutput(registerAttendee.name, result);
  return result;
}

function logFunctionOutput(name, returnValue) {
  Logger.log("====================START" + name + "===============");
  Logger.log("VALUE------------>");
  Logger.log(returnValue);
  Logger.log("====================END" + name + "===============");
}
