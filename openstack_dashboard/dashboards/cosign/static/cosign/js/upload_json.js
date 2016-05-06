var file_upload = null;

function check_json(json) {
    try {
        file_upload = JSON.parse(json);
        if (file_upload.vnodes.length == 0) {
            $.bootstrapGrowl("The supplied JSON has no virtual nodes", {
                ele: 'body',
                type: 'danger',
                offset: {from: 'top', amount: 20},
                align: 'right',
                width: 'auto',
                delay: 4000,
                allow_dismiss: true,
                stackup_spacing: 10
            });
        }
        for (var n = 0; n < file_upload.vlinks.length; n++) {
            var id_to = file_upload.vlinks[n].to;
            var id_from = file_upload.vlinks[n].from;
            var found_to = false;
            var fount_from = false;
            for (var v = 0; v < file_upload.vnodes.length; v++) {
                if (file_upload.vnodes[v].id == id_from) {
                    found_from = true;
                }
                if (file_upload.vnodes[v].id == id_to) {
                    found_to = true;
                }
            }
            if (!found_to || !found_from) {
                $.bootstrapGrowl("The supplied JSON has wrong virtual links", {
                    ele: 'body',
                    type: 'danger',
                    offset: {from: 'top', amount: 20},
                    align: 'right',
                    width: 'auto',
                    delay: 4000,
                    allow_dismiss: true,
                    stackup_spacing: 10
                });
            }
        }
    }
    catch(err) {
        $.bootstrapGrowl("File content is not a JSON object", {
            ele: 'body',
            type: 'danger',
            offset: {from: 'top', amount: 20},
            align: 'right',
            width: 'auto',
            delay: 4000,
            allow_dismiss: true,
            stackup_spacing: 10
        });
    }
}

function readSingleFile(evt) {
    //Retrieve the first (and only!) File from the FileList object
    var f = evt.target.files[0];
    if (f) {
        var r = new FileReader();
        r.onload = function(e) { 
            check_json()
        }
        r.readAsText(f);
    }
    else {
        alert("Failed to load file");
    }
}

$(function() {
    document.getElementById('input-1').addEventListener('change', readSingleFile, false);
});
