$(document).ready(function () {
    // Variabili per lo stepper
    let currentStep = 1;
    const totalSteps = 3;

    // Mostra/nascondi stepper in base al ruolo selezionato
    $("#ruoloField").on("change", function () {
        const role = $(this).val();
        if (role === "gestore") {
            $("#gestoreStepper, #stepperNavigation").show();
            $("#submitBtn").hide();
            // Resettiamo allo step 1 quando diventa gestore
            currentStep = 1;
            updateStepperState();
        } else {
            $("#gestoreStepper, #stepperNavigation").hide();
            $("#submitBtn").show(); // Mostra il pulsante di registrazione
            // Nascondi tutti i passaggi extra
            hideAllStepsExcept(1);
            // NON chiamare updateStepperState() per i clienti
        }
    });

    // Gestione pulsante Avanti
    $("#nextStepBtn").on("click", function () {
        if (validateCurrentStep()) {
            if (currentStep < totalSteps) {
                currentStep++;
                updateStepperState();
            }
        }
    });

    // Gestione pulsante Indietro
    $("#prevStepBtn").on("click", function () {
        if (currentStep > 1) {
            currentStep--;
            updateStepperState();
        }
    });

    // UN SOLO gestore di submit del form
    $("#registerForm").on("submit", function (e) {
        e.preventDefault();
        $("#register-message").hide();

        const formData = new FormData();
        formData.append("nome", $("#nomeField").val());
        formData.append("email", $("#emailField").val());
        formData.append("password", $("#passwordField").val());
        formData.append("ruolo", $("#ruoloField").val());

        let ruolo = $("#ruoloField").val();
        const avatar = $("#profileImageField")[0]?.files[0];
        if (avatar) formData.append("profileImage", avatar);

        console.log("formData", formData);
        // Crea l'oggetto dati da inviare

        const $submitBtn = $(this).find('button[type="submit"]');
        const originalText = $submitBtn.text();
        $submitBtn
            .prop("disabled", true)
            .html(
                '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Registrazione...'
            );

        // Prima gestione dell'immagine del profilo

        // Registra l'utente
        $.ajax({
            url: apiConfig.apiUrl + "/users/register",
            type: "POST",
            data: formData,
            processData: false,
            contentType: false,
        })
            .done(function (response) {
                // Se l'utente è un gestore, crea anche la sede
                if (ruolo === "gestore") {
                    // Salva token di autenticazione
                    localStorage.setItem("authToken", response.token);

                    // Prepara dati sede
                    const sedeData = {
                        nome: $("#sedeNameField").val(),
                        descrizione: $("#sedeDescriptionField").val(),
                        indirizzo: $("#sedeAddressField").val(),
                        citta: $("#sedeCityField").val(),
                        provincia: $("#sedeProvinceField").val(),
                        cap: $("#sedeCapField").val(),
                        regione: $("#sedeRegionField").val(),
                        latitudine: parseFloat($("#sedeLatField").val()) || null,
                        longitudine: parseFloat($("#sedeLngField").val()) || null,
                        attiva: $("#sedeActiveField").is(":checked") // true/false
                    };

                    // Crea sede con endpoint separato
                    $.ajax({
                        url: apiConfig.apiUrl + "/sedes/register",
                        type: "POST",
                        contentType: "application/json",
                        headers: {
                            Authorization: "Bearer " + response.token,
                        },
                        data: JSON.stringify(sedeData),
                    })
                        .done(function (sedeResponse) {
                            // Carica logo se presente
                            if ($("#sedeLogoField")[0].files.length > 0) {
                                uploadSedeLogo(
                                    sedeResponse.sede.id,
                                    $("#sedeLogoField")[0].files[0],
                                    function () {
                                        showSuccessAndRedirect();
                                    }
                                );
                            } else {
                                showSuccessAndRedirect();
                            }
                        })
                        .fail(function (sedeError) {
                            showError(sedeError, $submitBtn, originalText);
                        });
                } else {
                    // Cliente semplice - mostra successo e reindirizza
                    showSuccessAndRedirect();
                }
            })
            .fail(function (xhr) {
                showError(xhr, $submitBtn, originalText);
            });
    });

    // Funzione per caricare il logo usando FormData (multipart/form-data)
    function uploadSedeLogo(sedeId, file, callback) {
        const formData = new FormData();
        formData.append("logo", file);

        $.ajax({
            url: apiConfig.apiUrl + "/sedes/updateLogo/" + sedeId,
            type: "POST",
            data: formData,
            processData: false,
            contentType: false,
            headers: {
                Authorization: "Bearer " + localStorage.getItem("authToken"),
            },
            success: function (response) {
                callback();
            },
            error: function (error) {
                console.error("Errore nel caricamento del logo:", error);
                callback();
            },
        });
    }

    // Mostra messaggio di successo e reindirizza
    function showSuccessAndRedirect() {
        $("#register-message")
            .removeClass("alert-danger")
            .addClass("alert-success")
            .html("Registrazione avvenuta con successo! Reindirizzamento...")
            .slideDown();

        setTimeout(function () {
            window.location.href = "login.html";
        }, 1800);
    }

    // Mostra messaggio di errore
    function showError(xhr, $submitBtn, originalText) {
        let errorMsg = "Errore durante la registrazione. Riprova.";
        if (xhr.responseJSON && xhr.responseJSON.error) {
            errorMsg = xhr.responseJSON.error;
        }
        $("#register-message")
            .removeClass("alert-success")
            .addClass("alert-danger")
            .text(errorMsg)
            .slideDown();
        $submitBtn.prop("disabled", false).text(originalText);
    }

    // Funzione per aggiornare lo stato dello stepper
    function updateStepperState() {
        console.log("Aggiornamento stato stepper:", currentStep);

        // Aggiorna i pallini dello stepper
        $(".stepper-dot").removeClass("active completed");

        for (let i = 1; i <= totalSteps; i++) {
            if (i < currentStep) {
                $(`.stepper-dot[data-step="${i}"]`).addClass("completed");
            } else if (i === currentStep) {
                $(`.stepper-dot[data-step="${i}"]`).addClass("active");
            }
        }

        // Mostra solo il passaggio corrente
        hideAllStepsExcept(currentStep);

        // Aggiorna pulsanti di navigazione
        if (currentStep === 1) {
            $("#prevStepBtn").hide();
        } else {
            $("#prevStepBtn").show();
        }

        if (currentStep === totalSteps) {
            $("#nextStepBtn").hide();
            $("#submitBtn").show();
        } else {
            $("#nextStepBtn").show();
            $("#submitBtn").hide();
        }
    }

    // Funzione per nascondere tutti i passaggi tranne quello specificato
    function hideAllStepsExcept(stepToShow) {
        console.log("Nascondo tutti gli step tranne:", stepToShow);
        $(".step-content").hide();
        $(`#step${stepToShow}`).show();
    }

    // Funzione per validare il passaggio corrente
    function validateCurrentStep() {
        console.log("Validazione step:", currentStep);

        let valid = true;

        if (currentStep === 1) {
            // Valida email, password, nome, ecc.
            if (
                $("#nomeField").val() === "" ||
                $("#emailField").val() === "" ||
                $("#passwordField").val() === "" ||
                $("#ruoloField").val() === null
            ) {
                valid = false;
                alert("Compila tutti i campi obbligatori");
            }
        } else if (currentStep === 2) {
            // Valida i campi della sede
            if (
                $("#sedeNameField").val().trim() === "" ||
                $("#sedeDescriptionField").val().trim() === "" ||
                $("#sedeAddressField").val().trim() === "" ||
                $("#sedeCityField").val().trim() === ""
            ) {
                valid = false;
                alert("Compila i campi obbligatori della sede: Nome, Descrizione, Indirizzo e Città.");
            }
        }
    }

    // Funzione per convertire l'immagine in base64
    function handleImageUpload(file, callback) {
        if (!file) {
            callback(null);
            return;
        }

        const reader = new FileReader();
        reader.onload = function (e) {
            callback(e.target.result);
        };
        reader.readAsDataURL(file);
    }
});
