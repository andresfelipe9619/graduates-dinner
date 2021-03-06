// <script type="text/babel">

$(document).ready(init_js);
var buttonpressed;
var personIndex;
function init_js() {
  $(".submit.button").click(function() {
    buttonpressed = $(this).attr("name");
  });

  formValidation();
  loadAcademicProgramsAndFaculties();
  $(".ui.radio.checkbox").checkbox();
  $("select.dropdown").dropdown();
  $(".ui.modal").modal();
  $(".ui.modal").modal("setting", "closable", false);

  $(".numeric").on("keypress", function(e) {
    return (
      e.metaKey || // cmd/ctrl
      e.which <= 0 || // arrow keys
      e.which == 8 || // delete key
      /[0-9]/.test(String.fromCharCode(e.which))
    ); // numbers
  });

  $("#busca-cedula").on("keyup", function(event) {
    event.preventDefault();
    // Number 13 is the "Enter" key on the keyboard
    if (event.keyCode === 13) {
      // Trigger the button element with a click
      document.getElementById("btn-search").click();
    }
  });
}

function validationpassed(e) {
  try {
    e.preventDefault();
    var mForm = $(".ui.form");
    var formData = mForm.serializeArray();
    mForm.addClass("loading");

    if (!$(".file-field").hasClass("not-visible")) {
      var file = $('input[type="file"]').prop("files")[0];
      var reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = function(e) {
        function onSuccess(result) {
          if (result) {
            formData.push({ name: "doc_file", value: result.url });
            addPayment(formData);
          }
        }
        google.script.run
          .withSuccessHandler(onSuccess)
          .withFailureHandler(errorHandler)
          .createStudentFolder(
            $("input[name='cedula']").val(),
            e.target.result
          );
      };
    } else {
      formData.push({ name: "doc_file", value: "SRA" });
      addPayment(formData);
    }
  } catch (error) {
    $(".ui.error.message").text(error.toString());
  }
}

function addPayment(formData) {
  console.log("all is ok", buttonpressed);
  // if (buttonpressed == "submit-btn") {
  formData.push({ name: "pago_generado", value: "NO" });
  // }

  var index_vegetariana = -1;
  var vegetariana = formData.find((field, index) => {
    index_vegetariana = index;
    return field.name == "cena_vegetariana";
  });
  console.log(vegetariana);
  if (index_vegetariana > -1 && vegetariana) {
    if (formData[index_vegetariana].value == "on") {
      formData[index_vegetariana].value = "SI";
    } else {
      formData[index_vegetariana].value = "NO";
    }
  } else {
    formData.push({ name: "cena_vegetariana", value: "NO" });
  }

  console.log("form", formData);
  registerPersonInSheet(formData);
}

function registerPersonInSheet(formData) {
  function onSuccess(response) {
    if (response.ok) {
      $(".ui.form").removeClass("loading");

      $("#result-msg").text("");
      $("#result-msg").text(
        "Su inscripción a la Cena de Gala Egresados 2019 fue realizada de manera exitosa. Recuerde que usted cuenta con 48 horas para generar su pago. Pasadas estas 48 horas, el sistema deshabilitará la inscripción."
      );
      $(".ui.modal").modal("show");
      $(".actions").css("display", "block");
    } else {
      console.log("You fucked up", response);
    }
  }
  console.log(formData);
  google.script.run
    .withSuccessHandler(onSuccess)
    .withFailureHandler(errorHandler)
    .registerPerson(formData);
}

function searchForPerson() {
  hideForm();
  $("#btn-search").addClass("loading");
  function onSuccessSearch(person) {
    if (person) {
      showForm();
      $(".ui.form").addClass("loading");
      console.log("A nice formatted person", person);
      $("#btn-search").removeClass("loading");
      $("input[name='cedula']").prop("readonly", true);
      $("input[name='cedula']").addClass("not-allowed");
      if (person.isRegistered) {
        return loadPersonInForm(person);
      }
      return searchPersonInSRA(cedula);
    }
    console.log("Something went wrong searching user...");
  }
  var cedula = $("#busca-cedula").val();
  if (cedula.length > 0) {
    google.script.run
      .withSuccessHandler(onSuccessSearch)
      .withFailureHandler(errorHandler)
      .searchPerson(cedula);
  } else {
    $("#btn-search").removeClass("loading");
    $("#search-msg").html("Por favor ingrese una cedula");
    $("#search-msg").css("display", "block");
    setTimeout(function() {
      $("#search-msg").html("Por favor ingrese una cedula");
      $("#search-msg").css("display", "none");
    }, 3000);
  }
}

function disableFormFielfds(bool) {
  if (bool) {
    $("input:not([name='busca-cedula'])").prop("readonly", true);
    $("input:not([name='busca-cedula'])").addClass("not-allowed");
    $(".ui.checkbox").checkbox();
    $(".ui.checkbox").prop("read-only", false);
    $(".ui.checkbox").addClass("not-allowed");
    $("input[type='checkbox']").addClass("not-allowed");
  } else {
    $("input:not([name='busca-cedula'])").prop("readonly", false);
    $("input:not([name='busca-cedula'])").removeClass("not-allowed");
    $(".ui.checkbox").checkbox();
    $(".ui.checkbox").prop("read-only", false);
    $(".ui.checkbox").removeClass("not-allowed");
    $("input[type='checkbox']").removeClass("not-allowed");
  }
}
var normalize = (function() {
  var from = "ÃÀÁÄÂÈÉËÊÌÍÏÎÒÓÖÔÙÚÜÛãàáäâèéëêìíïîòóöôùúüûÑñÇç",
    to = "AAAAAEEEEIIIIOOOOUUUUaaaaaeeeeiiiioooouuuuÑñcc",
    mapping = {};

  for (var i = 0, j = from.length; i < j; i++)
    mapping[from.charAt(i)] = to.charAt(i);

  return function(str) {
    var ret = [];
    for (var i = 0, j = str.length; i < j; i++) {
      var c = str.charAt(i);
      if (mapping.hasOwnProperty(str.charAt(i))) ret.push(mapping[c]);
      else ret.push(c);
    }
    return ret.join("");
  };
})();

function loadSRAPersonInForm(person) {
  console.log("PersonSRA in form", person);
  var full_name = person.nombre.split(" ");
  $("input[name='nombres']").val(
    full_name[2] + " " + (full_name[3] != null ? full_name[3] : "")
  );
  $("input[name='apellidos']").val(full_name[0] + " " + full_name[1]);
  $("input[name='cedula']").prop("readonly", true);
  $("input[name='cedula']").addClass("not-allowed");
  $("input[name='nombres']").prop("readonly", true);
  $("input[name='nombres']").addClass("not-allowed");
  $("input[name='apellidos']").prop("readonly", true);
  $("input[name='apellidos']").addClass("not-allowed");
  $(".file-field").addClass("not-visible");
  // $(".pay-info").css("display", "none");

  // $("input[name='politicas']").prop('checked', true)

  if (person.titulo.length > 0) {
    var firstProgram = normalize(person.titulo[person.titulo.length - 1]);
    var hasEnfasis = firstProgram.indexOf("Enfasis");
    if (hasEnfasis > -1) {
      firstProgram = firstProgram.substr(0, hasEnfasis);
      console.log("enfasis", hasEnfasis);
    }

    var programArray = firstProgram.split(" ");
    programArray.splice(-1, 1);
    var firstProgramWord = programArray[0];

    var lessWord = firstProgramWord.slice(0, firstProgramWord.length - 3);
    var restProgramWords = programArray.slice(1, programArray.length).join(" ");
    var restFemenineWord = restProgramWords.slice(
      0,
      restProgramWords.length - 3
    );

    console.log(programArray);
    console.log(firstProgramWord);
    console.log(lessWord);
    console.log(restFemenineWord);
    function onSuccess(result) {
      var isGood = false;
      if (!result) return isGood;
      $.each(result.programs, function(i, program) {
        if (String(program["titulo_otorgado"]).includes(restFemenineWord) > 0) {
          console.log("OMG", String(program["titulo_otorgado"]).split(" "));

          if (
            String(program["titulo_otorgado"])
              .split(" ")[0]
              .includes(lessWord) > 0
          ) {
            console.log("first");

            $("select[name='programa']").dropdown(
              "set selected",
              program.nombre
            );
            $(".dropdown").dropdown();
            $(".ui.dropdown").addClass("disabled");
            $(".fields.regreso").addClass("not-allowed");
            isGood = true;
          }
        } else {
          isGood = false;
        }
      });
      $(".ui.form").removeClass("loading");
    }
    return google.script.run
      .withSuccessHandler(onSuccess)
      .withFailureHandler(errorHandler)
      .getFacultiesAndPrograms();
  }
}

function loadPersonInForm(person) {
  console.log("Person in form", person);
  const isPaymentApproved = person.data["pago_comprobado"] === "SI";
  const isPaymentGenerated = person.data["pago_generado"] === "SI";
  personIndex = Number(person.index) + 1;
  fillInFormData(person.data);
  if (isPaymentApproved) {
    showApprovedPayMessage();
  } else {
    showNotRegisteredPayMessage();
  }

  $(".ui.dropdown").addClass("disabled");
  $(".fields.regreso").addClass("not-allowed");
  $(".file-field").addClass("not-visible");
  $("#submit-btn").addClass("not-visible");
  $("#submit-pay-btn").addClass("not-visible");
  if (!isPaymentGenerated) {
    $("#register-pay-btn").removeClass("not-visible");
    $("#register-pay-btn").addClass("visible");
  }
  $("input[name='politicas']").prop("checked", true);
  disableFormFielfds(true);
  $(".ui.form").removeClass("loading");
}

function fillInFormData(data) {
  $("input[name='nombres']").val(data.nombres);
  $("input[name='apellidos']").val(data.apellidos);
  $("input[name='cedula']").val(data.cedula);
  $("input[name='correo']").val(data.correo);
  $("input[name='celular']").val(data.celular);
  $("select[name='programa']").dropdown("set selected", data.programa);
  $("select[name='facultad']").dropdown("set selected", data.facultad);
  if (data["cena_vegetariana"] == "SI") {
    $("input[name='cena_vegetariana']").prop("checked", true);
  } else {
    $("input[name='cena_vegetariana']").prop("checked", false);
  }
}

function showNotRegisteredPayMessage() {
  $("#pay-msg").removeClass("not-visible");
  $("#pay-msg").removeClass("success");
  $("#pay-msg").addClass("warning");
  $("#pay-msg").append(`<i class="icon warning "></i>
        El pago de su inscripción aun no ha sido registrado. Recuerde que después de 48 horas sin registrar el pago, el sistema anulará su inscripción.
        Si presenta alguna dificultad en el proceso de inscripción, por favor escribanos al correo electrónico soyegresado@correounivalle.edu.co
      </div>`);
}

function showApprovedPayMessage() {
  $("#pay-msg").removeClass("not-visible");
  $("#pay-msg").removeClass("warning");
  $("#pay-msg").addClass("success");
  $("#pay-msg").append(`<i class="icon check circle"></i>
        El pago de su inscripción a la Noche de Gala de Egresados fue registrado satisfactoriamente. Le esperamos el
        próximo 06 de diciembre de 2019.
        Si presenta alguna dificultad en el proceso de inscripción, por favor escribanos al correo electrónico soyegresado@correounivalle.edu.co
      </div>`);
}

function modalPayment() {
  var onSuccess = function(person) {
    if (!person) return console.log("Something went wrong searching user...");
    if (!person.isRegistered) return;
    personIndex = ++person.index;
    if (!personIndex) return;
    function fullSuccess(result) {
      console.log("result", result);
      $("#modal-payment").removeClass("loading");
      $(".ui.modal").modal("hide");
      hideForm();
      return true;
    }
    return google.script.run
      .withSuccessHandler(fullSuccess)
      .withFailureHandler(errorHandler)
      .generatePayment(personIndex);
  };

  var cedula = $("#busca-cedula").val();
  $("#modal-payment").addClass("loading");
  if (cedula.length > 0) {
    return google.script.run
      .withSuccessHandler(onSuccess)
      .withFailureHandler(errorHandler)
      .searchPerson(cedula);
  }
}

function submitPayment() {
  $("#register-pay-btn").addClass("loading");

  if (personIndex > -1) {
    function onSuccess(result) {
      $("#register-pay-btn").removeClass("loading");
      if (result) {
        //   $("#result-msg").append(`Apreciado Egresado, su inscripción ha sido registrada. Para realizar el pago,
        //   por favor dar clic en el botón realizar pago
        //   Recuerde realizar el pago en un periodo menor a 48 horas para reservar su cupo en el evento.
        //   Una vez realizado el pago, en un lapso máximo de 48 horas recibirá el correo oficial de bienvenida.
        //   Si presenta alguna dificultad en el proceso de inscripción, por favor escribanos al correo electrónico soyegresado@correounivalle.edu.co`)
        // $(".ui.modal").modal("show");
        console.log("result", result);
        hideForm();
        return true;
      }
    }
    return google.script.run
      .withSuccessHandler(onSuccess)
      .withFailureHandler(errorHandler)
      .generatePayment(personIndex);
  }
}

function errorHandler(error) {
  console.log("ERROR HANDLER ==>", error);
  $(".loading").removeClass("loading");
  $("#error-msg").removeClass("not-visible");
  $("#error-msg").text(String(error));
  setTimeout(() => {
    $("#error-msg").addClass("not-visible");
    $("#error-msg").text("");
  }, 5000);
}

function showForm() {
  $("#mainForm").css("display", "block");
  $("ui.submit.button").css("display", "block");
  $("#register-pay-btn").removeClass("visible");
  $("#register-pay-btn").addClass("not-visible");
  $("input[name='cedula']").val($("#busca-cedula").val());
  disableFormFielfds(false);
}

function hideForm() {
  $("#mainForm").css("display", "none");
  $(".fields.regreso").removeClass("not-allowed");
  $(".file-field").removeClass("not-visible");
  $("#submit-btn").removeClass("not-visible");
  $("#submit-pay-btn").removeClass("not-visible");
  $("input[name='politicas']").prop("checked", false);
  $("input[name='cena_vegetariana']").prop("checked", false);
  $(".dropdown").dropdown();
  $(".ui.dropdown").removeClass("disabled");
  $(".fields.regreso").removeClass("not-allowed");
  $("#pay-msg").addClass("not-visible");
  $("#pay-msg").text("");

  disableFormFielfds(false);
  $(".ui.form").form("clear");
}

function loadAcademicProgramsAndFaculties() {
  function onSuccess(result) {
    console.log("good job", result);
    if (result) {
      $.each(result.programs, function(i, program) {
        $("select[name='programa']").append(
          $("<option>", {
            value: program.nombre,
            text: program.nombre
          })
        );
      });

      $.each(result.faculties, function(i, faculty) {
        $("select[name='facultad']").append(
          $("<option>", {
            value: faculty,
            text: faculty
          })
        );
      });

      $("select[name='programa']").on("change", function(e) {
        $.each(result.programs, function(i, program) {
          if (e.target.value == program.nombre) {
            $("select[name='facultad']").val(program.facultad);
            $("select[name='facultad']").trigger("change");
            return false;
          }
        });
      });
    }
  }
  google.script.run
    .withSuccessHandler(onSuccess)
    .withFailureHandler(errorHandler)
    .getFacultiesAndPrograms();
}

function searchPersonInSRA(cedula) {
  function onSuccess(result) {
    console.log("good job", result);
    if (!result) return;
    var resultObject = JSON.parse(result);
    if (resultObject.titulo.length && resultObject.nombre.length) {
      return loadSRAPersonInForm(resultObject);
    }
    $(".ui.form").removeClass("loading");
    return null;
  }

  return google.script.run
    .withSuccessHandler(onSuccess)
    .withFailureHandler(errorHandler)
    .getSRAPerson(cedula);
}

function testing() {
  var users = [];

  users.map(function(user, i) {
    checkStatus(user);
  });
}

function checkStatus(user) {
  var result = searchPersonInSRA(user);
  if (result) {
    console.log("OK :D");
  } else {
    console.log("NOT OK :|");
  }
}

function formValidation() {
  $(".ui.form").form({
    inline: true,
    on: "blur",
    transition: "fade down",
    onSuccess: validationpassed,
    fields: {
      nombres: {
        identifier: "nombres",
        rules: [
          {
            type: "empty",
            prompt: "Por favor ingrese un nombre"
          }
        ]
      },
      apellidos: {
        identifier: "apellidos",
        rules: [
          {
            type: "empty",
            prompt: "Por favor ingrese un apellido"
          }
        ]
      },
      cedula: {
        identifier: "cedula",
        rules: [
          {
            type: "number",
            prompt: "Por favor ingrese una cedula valido"
          },
          {
            type: "empty",
            prompt: "Por favor ingrese una cedula"
          }
        ]
      },
      celular: {
        identifier: "celular",
        rules: [
          {
            type: "number",
            prompt: "Por favor ingrese un numero valido"
          },
          {
            type: "empty",
            prompt: "Por favor ingrese un numero"
          }
        ]
      },
      email: {
        identifier: "correo",
        rules: [
          {
            type: "email",
            prompt: "Por favor ingrese a correo valido"
          },
          {
            type: "empty",
            prompt: "Por favor ingrese un correo"
          }
        ]
      },
      programa: {
        identifier: "programa",
        rules: [
          {
            type: "empty",
            prompt: "Por favor ingrese un programa"
          }
        ]
      },
      politicas: {
        identifier: "politicas",
        rules: [
          {
            type: "checked",
            prompt: "Por favor acepte nuestras politicas para inscribirse"
          }
        ]
      },
      facultad: {
        identifier: "facultad",
        rules: [
          {
            type: "empty",
            prompt: "Por favor ingrese una facultad"
          }
        ]
      }
    }
  });
}

// </script>
