$(function () {
    /* CSRF TOKEN IS REQUIRED FOR AJAX REQUESTS*/
    $.ajaxSetup({
        data: {csrfmiddlewaretoken: window.CSRF_TOKEN},
    });
    /* BUTTON METHODS */
    $('#clear-vdc').click(function() {
        bootbox.confirm({
            title: 'Warning',
            message: 'Are you sure you want to clear the request?',
            buttons: {
                'cancel': {
                    label: 'Cancel',
                    className: 'btn-default pull-left'
                },
                'confirm': {
                    label: 'Clear',
                    className: 'btn-danger pull-right'
                }
            },
            callback: function(result) {
                if (result) {
                    /* Tell Horizon the VDC must be unstacked */
                    $.ajax({
                        type:"POST",
                        crossDomain: true,
                        xhrFields: {withCredentials: true},
                        url: document.URL+"delete_vdc/",
                        beforeSend: function() {
                            $('#clear-vdc').toggleClass('active');
                            $("#clear-vdc").prop('disabled', true);
                            $("#submit-vdc").prop('disabled', true);
                            $('.vis-button').hide();
                        },
                        complete: function(response) {
                            $('#clear-vdc').toggleClass('active');
                            $("#clear-vdc").prop('disabled', false);
                            $("#submit-vdc").prop('disabled', false);
                            $('.vis-button').show();
                            console.log(response);
                        },
                        success: function(response) {
                            response = response.slice(1, response.length-1);
                            if (response == "Delete operation has been processed") {
                                /* Show notification */
                                $.bootstrapGrowl(response, {
                                    ele: 'body', // which element to append to
                                    type: 'success', // (null, 'info', 'danger', 'success')
                                    offset: {from: 'top', amount: 20}, // 'top', or 'bottom'
                                    align: 'right', // ('left', 'right', or 'center')
                                    width: 'auto', // (integer, or 'auto')
                                    delay: 4000, // Time while the message will be displayed. It's not equivalent to the *demo* timeOut!
                                    allow_dismiss: true, // If true then will display a cross to close the popup.
                                    stackup_spacing: 10 // spacing between consecutively stacked growls.
                                });
                                /* Clear the DOM */
                                var options = get_topology_options();
                                nodes = new vis.DataSet();
                                edges = new vis.DataSet();
                                var virtual_nodes = new vis.DataSet();
                                var virtual_links = new vis.DataSet();
                                topology = {
                                    nodes: nodes,
                                    edges: edges
                                };
                                container = document.getElementById('network');
                                network = new vis.Network(container, topology, options);
                                network.on("click", function (params) {
                                    info_listener(params);
                                });
                                request = {
                                    tenantID: tenant_id,
                                    vnodes: [],
                                    vlinks: [],
                                };
                                save_topology();
                            }
                        },
                        error: function(response) {
                            $('#clear-vdc').toggleClass('active');
                            $.bootstrapGrowl(response, {
                                ele: 'body', // which element to append to
                                type: 'danger', // (null, 'info', 'danger', 'success')
                                offset: {from: 'top', amount: 20}, // 'top', or 'bottom'
                                align: 'right', // ('left', 'right', or 'center')
                                width: 'auto', // (integer, or 'auto')
                                delay: 4000, // Time while the message will be displayed. It's not equivalent to the *demo* timeOut!
                                allow_dismiss: true, // If true then will display a cross to close the popup.
                                stackup_spacing: 10 // spacing between consecutively stacked growls.
                           });

                        }
                    });
                    $('#request').empty();
                }
            }
        });
    });
    $('#submit-vdc').click(function() {
        bootbox.confirm({
            title: 'Attention',
            message: 'Do you want to deploy the request?',
            buttons: {
                'cancel': {
                    label: 'Cancel',
                    className: 'btn-default pull-left'
                },
                'confirm': {
                    label: 'Deploy',
                    className: 'btn-primary pull-right'
                }
            },
            callback: function(result) {
                if (result) {
                    /* TODO: Tell the algorithms to deploy the request */
                    var url = document.URL+"submit_vdc/";
                    $.ajax({
                        type:"POST",
                        crossDomain: true,
                        xhrFields: {withCredentials: true},
                        url: url,
                        data: {csrfmiddlewaretoken: window.CSRF_TOKEN, json: JSON.stringify(request)},
                        dataType: 'json',
                        beforeSend: function() {
                            $('#submit-vdc').toggleClass('active');
                            $("#clear-vdc").prop('disabled', true);
                            $("#submit-vdc").prop('disabled', true);
                            $('.vis-button').hide();
                        },
                        complete: function(response) {
                            $('#submit-vdc').toggleClass('active');
                            $("#clear-vdc").prop('disabled', false);
                            $("#submit-vdc").prop('disabled', false);
                            $('.vis-button').show();
                            console.log("submit request complete");
                            console.log(response)
                        },
                        success: function(response) {
                            console.log("Request succes");
                            console.log(response);
                            if (response == "The VDC given has been registered") {
                                $.bootstrapGrowl(response, {
                                    ele: 'body', // which element to append to
                                    type: 'success', // (null, 'info', 'danger', 'success')
                                    offset: {from: 'top', amount: 20}, // 'top', or 'bottom'
                                    align: 'right', // ('left', 'right', or 'center')
                                    width: 'auto', // (integer, or 'auto')
                                    delay: 4000, // Time while the message will be displayed. It's not equivalent to the *demo* timeOut!
                                    allow_dismiss: true, // If true then will display a cross to close the popup.
                                    stackup_spacing: 10 // spacing between consecutively stacked growls.
                                });
                                nodes.update(new_vnodes);
                                edges.update(new_vlinks);
                                $('#network').effect("highlight", {color: "#00AAA0"}, 600);
                            }
                        },
                        error: function(response) {
                            $('#submit-vdc').toggleClass('active');
                            $.bootstrapGrowl(response, {
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
                    });
                }
            }
        });
    });
});

