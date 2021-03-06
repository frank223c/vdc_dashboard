var request = null;
var nodes = null;
var edges = null;
var network = null;
var topology = null;
var vnode_index = null;
var node = null;
var changed = false;

function destroy_topology() {
    if (network !== null) {
        network.destroy();
        network = null;
    }
    var nodes = null;
    var edges = null;
}

function update_network_color() {
    var nodes_ids = nodes.getIds();
    var edges_ids = edges.getIds();
    var update_nodes = [];
    var update_edges = [];
    for (var i = 0; i < nodes_ids.length; i++) {
        update_nodes.push({id: nodes_ids[i], image: STATIC_URL + "cosign/img/stack-green.svg"})
    }
    for (var e = 0; e < edges_ids.length; e++) {
        update_edges.push({id: edges_ids[e], color: "#00AAA0"})
    }
    nodes.update(update_nodes);
    edges.update(update_edges);
}

function load_topology(deployed) {
    destroy_topology();
    var container = document.getElementById('network');
    request = jQuery.extend(true, {}, submitted_request);
    var submitted_nodes = jQuery.extend(true, {}, submitted_request.vnodes);
    var submitted_edges = jQuery.extend(true, {}, submitted_request.vlinks);
    /* Add the submitted vdc to the network */
    var image = "cosign/img/stack";
    var color = "";
    if (deployed) {
        image += "-green.svg";
        color = "#00AAA0"
    }
    else {
        image += "-gray.svg";
        color = "#333333"
    }
    for (var key in submitted_nodes) {
        nodes.add({
            id: submitted_nodes[key].id,
            label: submitted_nodes[key].label,
            x: submitted_nodes[key].x,
            y: submitted_nodes[key].y,
            image: STATIC_URL + image,
            borderWidth: 0,
            shape: 'image',
            size: 40
        });
    }
    for (var key in submitted_edges) {
        edges.add({
            title: "Bw: " + submitted_edges[key].bandwith + " Mbps.",
            id: submitted_edges[key].id,
            bandwith: submitted_edges[key].bandwith,
            to: submitted_edges[key].to,
            from: submitted_edges[key].from,
            color: color
        });
    }
    topology = {
        nodes: nodes,
        edges: edges
    };
    /* Create a new network with the retrieved data */
    var options = get_topology_options();
    network = new vis.Network(container, topology, options);
//  network.fit();
    network.on("click", function (params) {
        info_listener(params);
    });
    show_request(request);
}

function get_topology_options() {
    var locales = {
        en: {
            edit: 'Edit',
            del: 'Delete selected',
            back: 'Back',
            addNode: 'Add Virtual Node',
            addEdge: 'Add Virtual Link',
            editNode: 'Edit Virtual Node Name',
            editEdge: 'Edit VIrtual Edge',
            addDescription: 'Click in an empty space to place a new virtual node.',
            edgeDescription: 'Click on a node and drag the edge to another node to connect them.',
            editEdgeDescription: 'Click on the control points and drag them to a node to connect to it.',
            createEdgeError: 'Cannot link edges to a cluster.',
            deleteClusterError: 'Clusters cannot be deleted.',
            editClusterError: 'Clusters cannot be edited.'
        }
    };
    var topology_options = {
        autoResize: true,
        locale: 'en',
        locales: locales,
        interaction: {
            zoomView: true
        },
        physics: {
            enabled: true,
            stabilization: {
                enabled: true,
                fit: true
            },
            barnesHut: {
                  gravitationalConstant: -2000,
                  centralGravity: 0.2,
                  springLength: 95,
                  springConstant: 0.04,
                  damping: 0.5,
                  avoidOverlap: 1
            }
        },
        manipulation: {
            addNode: function (data, callback) {
                $('#add_node_submit').prop('disabled', false);
                $('#add_node').modal('show');
                $('#add_vnode_link_list').empty();
                for (var n = 0; n < request.vnodes.length; n++) {
                    $('#add_vnode_link_list').append('<div><input class="new-vnode-link" id=' + request.vnodes[n].id + ' type="number" min="1" placeholder="Bandwith"> to <label>'+ request.vnodes[n].label +'</label> </div>');
                }
                if (nodes.length == 0) $('#add-node-description').hide();
                else $('#add-node-description').show();
                $('#add_vnode_submit').unbind().click(function(data) {
                    var label = $('#node_name').val();
                    data.label = removeTags(label);
                    data.shape = "image";
                    data.image = STATIC_URL + "cosign/img/stack-gray.svg";
                    data.borderWidth = 0;
                    data.size = 40;
                    nodes.add(data);
                    request.vnodes.push({
                        id: data.id,
                        label: data.label,
                        vms: []
                    });
                    var idArray = [];
                    $(".new-vnode-link").each(function() {
                        idArray.push(this.id);
                    });
                    for (var x = 0; x < idArray.length; x++) {
                        var bw = $('#'+idArray[x]).val();
                        if (bw) {
                            var addedEdgeID = edges.add({bandwith: 0, to: idArray[x], from: data.id, color: "#333333"});
                            request.vlinks.push({
                                id: addedEdgeID[0],
                                bandwith: bw,
                                to: idArray[x],
                                from: data.id
                            });
                        }
                    }
                    show_request(request);
                    $('#add_node').modal('hide');
                    network.disableEditMode();
                    changed = true;
                });
            },
            editNode: function (data, callback) {
                network.enableEditMode();
                bootbox.prompt("Enter the new desired Name for the <b> "+ data.label +"</b> node", function(result) {
                    if (result) {
                        result = removeTags(result);
                        var id = network.getSelectedNodes()[0];
                        nodes.update({id: id, label: result});
                        vis_new_nodes.update({id: id, label: result});
                        var i;
                        for (i = 0; i < request.vnodes.length; i++) {
                            if (request.vnodes[i].id == id) break;
                        }
                        request.vnodes[i].label = result;
                        show_request(request);
                        changed = true;
                    }
                });
            },
            addEdge: function (data, callback) {
                bootbox.prompt("Enter the desired Bandwith in Mbps for the <b> Virtual Link </b>", function(result) {
                    if (parseInt(result)) {
                        result = parseInt(removeTags(result));
                        data.title = "Bw: " + result + " Mbps."
                        data.bandwith = result;
                        data.color = "#333333";
                        edges.add(data);
                        vis_new_edges.add(data);
                        request.vlinks.push({
                            id: data.id,
                            bandwith: result,
                            to: data.to,
                            from: data.from,
                        });
                        show_request(request);
                        changed = true;
                    }
                    else {
                        $.bootstrapGrowl("Bandwith must be a number", {
                            ele: 'body',
                            type: 'danger',
                            offset: {from: 'top', amount: 20},
                            align: 'right',
                            width: 'auto',
                            delay: 3000,
                            allow_dismiss: true,
                            stackup_spacing: 10
                        });
                        network.disableEditMode()
                    }
                });
                if (data.from == data.to) {
                    var r = confirm("Do you want to connect the node to itself?");
                    if (r == true) {
                        edges.add(data);
                    }
                }
            },
            editEdge: false,
            deleteEdge: false,
            deleteNode: false
        }
    };
    return topology_options;
}

function get_index_of(id) {
    var i;
    for (i = 0; i < request.vnodes.length; i++) {
        if(request.vnodes[i].id == id) return i;
    }
}

function show_info(id,posX,posY) {
    $('#balloon').show();
    $('.popover-arrow').show();
    $('#balloon').css({"left": posX + 50, "top": posY + 80});
    $('.popover-arrow').css({"left": posX + 40, "top": posY + 100});
}

function info_listener(params) {
    /* If the user clicks a node display the information of that node */
    if (params.nodes.length == 0) return false;
    var id = params.nodes[0];
    var pos = network.getPositions(id)[id];
    pos = network.canvasToDOM(pos);
    show_info(id,pos.x,pos.y);
    /* Populate the popover */
    node = network.getSelectedNodes()[0];
    var label = nodes["_data"][node].label;
    var id = nodes["_data"][node].id;
    $("#balloon-virtual-node-label").html(label);
    $("#balloon-virtual-node-id").html(id);
    vnode_index =  get_index_of(id);
    if (nodes["_data"][id].image.indexOf("gray") == -1) {
        $("#device-status").text("ACTIVE"); 
        $("#device-status").removeClass("inactive");
        $("#device-status").addClass("active");
    } else {
        $("#device-status").text("INACTIVE");
        $("#device-status").removeClass("active");
        $("#device-status").addClass("inactive");
    }
    $('#balloon-instances-list tr:gt(0)').remove();
    for (var i = 0; i < request.vnodes[vnode_index].vms.length; i++) {
        var vm_label = request.vnodes[vnode_index].vms[i].label;
        var vm_flavor = request.vnodes[vnode_index].vms[i].flavorName;
        var row = "<tr><td><span>"+vm_label+"</span></td><td>"+vm_flavor+"</td><td class='delete'><button class='delete-port btn btn-danger btn-xs' onclick='remove_instance_vnode("+i+")'>Remove</button></td></tr>"
        $('#balloon-instances-list').append(row);
    }
    $('#balloon-links-list tr:gt(0)').remove();
    for (var k = 0; k < request.vlinks.length; k++) {
        if (request.vlinks[k].to == id || request.vlinks[k].from == id) {
            var link_bw = request.vlinks[k].bandwith;
            if (request.vlinks[k].to == id) var link_to = request.vlinks[k].from;
            else var link_to = request.vlinks[k].to;
            link_to = nodes["_data"][link_to].label;
            var row = "<tr><th><span style='color:black;font-weight:normal'>"+link_to+"</span></th><td>"+link_bw+" Mbps</td><td class='delete'><button id='remove-link-vnode' class='delete-port btn btn-danger btn-xs' onclick='remove_link("+k+")'>Remove</button></td></tr>";
            $('#balloon-links-list').append(row);   
        }
    }
}

$(function() {
    $.ajaxSetup({
        data: {csrfmiddlewaretoken: window.CSRF_TOKEN},
    });
    nodes = new vis.DataSet();
    edges = new vis.DataSet();
    vis_new_nodes = new vis.DataSet();
    vis_new_edges = new vis.DataSet();
    /* If there's no topology request create a new one */
    if (submitted_request == null) {
        var options = get_topology_options();
        request = {
            vnodes: [],
            vlinks: [],
        };
        topology = {
            nodes: nodes,
            edges: edges
        };
        var container = document.getElementById('network');
        network = new vis.Network(container, topology, options);
        network.fit();
        network.on("click", function (params) {
            info_listener(params);
        });
    } /* Otherwise, load it*/ 
    else {
        load_topology(true);
    }
    show_request(request);
});
