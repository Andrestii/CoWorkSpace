$(document).ready(function () {
    let currentStep = 1;
    const totalSteps = 3;

    // Mostra/nascondi stepper in base al ruolo selezionato
    $("#ruoloField").on("change", function () {
        const role = $(this).val();
        if (role === "gestore") {
            $("#gestoreStepper, #stepperNavigation").show();
            $("#submitBtn").hide();
            currentStep = 1;
            updateStepperState();
        } else {
            $("#gestoreStepper, #stepperNavigation").hide();
            $("#submitBtn").show();
            hideAllStepsExcept(1);
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

        const $submitBtn = $(this).find('button[type="submit"]');
        const originalText = $submitBtn.text();
        $submitBtn
            .prop("disabled", true)
            .html(
                '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Registrazione...'
            );

        // Registra l'utente
        $.ajax({
            url: apiConfig.apiUrl + "/users/register",
            type: "POST",
            data: formData,
            processData: false,
            contentType: false,
        })
            .done(function (response) {
                const token = response.token || response.session?.access_token;
                if (token) localStorage.setItem("authToken", token);

                if ($("#ruoloField").val() === "gestore") {
                    const sedeFD = new FormData();
                    sedeFD.append("nome", $("#sedeNameField").val());
                    sedeFD.append("descrizione", $("#sedeDescriptionField").val());
                    sedeFD.append("indirizzo", $("#sedeAddressField").val());
                    sedeFD.append("citta", $("#sedeCityField").val());
                    sedeFD.append("provincia", $("#sedeProvinceField").val());
                    sedeFD.append("cap", $("#sedeCapField").val());
                    sedeFD.append("regione", $("#sedeRegionField").val());
                    const latRaw = $("#sedeLatField").val().trim().replace(",", ".");
                    const lngRaw = $("#sedeLngField").val().trim().replace(",", ".");

                    const lat = latRaw ? parseFloat(latRaw) : null;
                    const lng = lngRaw ? parseFloat(lngRaw) : null;

                    if (!isNaN(lat)) sedeFD.append("latitudine", lat.toFixed(7));
                    if (!isNaN(lng)) sedeFD.append("longitudine", lng.toFixed(7));

                    sedeFD.append("attiva", $("#sedeActiveField").is(":checked") ? "true" : "false");

                    const logo = $("#sedeLogoField")[0]?.files?.[0];
                    if (logo) sedeFD.append("immagine", logo);

                    $.ajax({
                        url: apiConfig.apiUrl + "/sedi/createSede",
                        type: "POST",
                        data: sedeFD,
                        processData: false,
                        contentType: false,
                        headers: { Authorization: "Bearer " + token },
                    })
                        .done(function () {
                            showSuccessAndRedirect();
                        })
                        .fail(function (err) {
                            showError(err, $submitBtn, originalText);
                        });
                } else {
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
            url: apiConfig.apiUrl + "/sedi/updateLogo/" + sedeId,
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
            if (
                !$("#nomeField").val().trim() ||
                !$("#emailField").val().trim() ||
                !$("#passwordField").val().trim() ||
                !$("#ruoloField").val()
            ) {
                valid = false;
                alert("Compila tutti i campi obbligatori");
            }
        } else if (currentStep === 2) {
            if (
                !$("#sedeNameField").val().trim() ||
                !$("#sedeDescriptionField").val().trim() ||
                !$("#sedeAddressField").val().trim() ||
                !$("#sedeCityField").val().trim()
            ) {
                valid = false;
                alert("Compila i campi obbligatori della sede: Nome, Descrizione, Indirizzo e Città.");
            }
        } else if (currentStep === 3) {
        }
        return valid;
    }

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
