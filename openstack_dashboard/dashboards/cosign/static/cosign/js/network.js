var request = null;
var vnodes = null;
var nodes = null;
var edges = null;
var network = null;
var topology = null;
var vnode_index = null;
var vlink_id = null;
var container;

function destroy_topology() {
    if (network !== null) {
        network.destroy();
        network = null;
    }
}

function remove_instance_vnode(index) {
    request.vnodes[vnode_index].vms.splice(index,1);
    a.hide();
    d.hide();
    save_topology();
}

function remove_link(index) {
    request.vlinks.splice(index,1);
    a.hide();
    d.hide();
    edges.remove(edges.getIds(index)[index]);
    save_topology();
}

function remove_vnode() {
    request.vnodes.splice(vnodes_index,1);
    //TODO: Remove from DataSet
}

function save_topology() {
    localStorage.setItem('nodes', JSON.stringify(nodes));
    localStorage.setItem('edges', JSON.stringify(edges));
    $.jStorage.set("request",request);
}

function load_topology() {
    destroy_topology();
    container = document.getElementById('network');    
    var stored_nodes = JSON.parse(localStorage.getItem('nodes'))["_data"];
    var stored_edges = JSON.parse(localStorage.getItem('edges'))["_data"];
    request = $.jStorage.get("request");
    nodes = new vis.DataSet();
    edges = new vis.DataSet();
    /* Add the retrieved data from local storage to the network */
    for (var key in stored_nodes) {
        nodes.add({
            id: stored_nodes[key].id,
            label: stored_nodes[key].label,
            x: stored_nodes[key].x,
            y: stored_nodes[key].y,
            image: STATIC_URL + "cosign/img/stack-gray.svg",
            borderWidth: 0,
            shape: 'image',
            size: 40
        });
    }
    for (var key in stored_edges) {
        edges.add({
            title: "Bw: " + stored_edges[key].bandwith + " Mbps.",
            id: stored_edges[key].id,
            bandwith: stored_edges[key].bandwith,
            to: stored_edges[key].to,
            from: stored_edges[key].from
        });
    }
    topology = {
        nodes: nodes,
        edges: edges
    };
    /* Create a new network with the retrieved data */
    var options = get_topology_options();
    network = new vis.Network(container, topology, options);
    network.fit();
}

function get_topology_options() {
    var topology_options = {
        interaction: {
            zoomView: true
        },
        physics: {
            enabled: true,
            barnesHut: {
                  gravitationalConstant: -2000,
                  centralGravity: 0,
                  springLength: 95,
                  springConstant: 0.04,
                  damping: 0.09,
                  avoidOverlap: 1
            }
        },
        manipulation: {
            addNode: function (data, callback) {
                bootbox.prompt("Enter desired Label for the new <strong> Virtual Node </strong>", function(result) {
                    if (result) {
                        label = result;
                        data.label = result;
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
                        save_topology();
                    }
                });
            },
            editNode: function (data, callback) {
                network.enableEditMode();
                bootbox.prompt("Enter the new desired Label for the <b> Virtual Node </b>", function(result) {
                    if (result) {
                        label = result;
                        var node = network.getSelectedNodes()[0];
                        var id = nodes["_data"][node].id;
                        nodes.update({id: id, label: label});
                        //TODO: update request node label
                        save_topology();
                    }
                });
            },
            addEdge: function (data, callback) {
                bootbox.prompt("Enter the desired Bandwith in Mbps for the <b> Virtual Link </b>", function(result) {
                    if(result) {
                        // TODO: Bandwith must be a number
                        data.title = "Bw: " + result + " Mbps."
                        data.bandwith = result;
                        edges.add(data);
                        request.vlinks.push({
                            id: data.id,
                            bandwith: result,
                            to: data.to,
                            from: data.from
                        });
                        save_topology();
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

function info_listener(params) {
    /* Due to vis.js limitations this is the most eficient solution to change the vis-manipulation text */
    var interval = setInterval(function() {
        $('.vis-connect').children('.vis-label').html("Add Link");
        if ($('.vis-connect').children('.vis-label').html() == "Add Link") {
            clearInterval(interval);
        }
    },1);
    /* If the user clicks a node display the information of that node */
    if (params.nodes.length == 0) return false;
    var id = params.nodes[0];
    var pos = network.getPositions(id)[id];
    pos = network.canvasToDOM(pos);
    showBalloon(id,pos.x,pos.y);
    /* Populate with data */
    var node = network.getSelectedNodes()[0];
    var label = nodes["_data"][node].label;
    var id = nodes["_data"][node].id;
    $("#balloon-virtual-node-label").html(label);
    $("#balloon-virtual-node-id").html(id);
    vnode_index =  get_index_of(id);
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
            var row = "<tr><th><span style='color:black;font-weight:normal'>"+link_to+"</span></th><td>"+link_bw+" Mbps</td><td class='delete'><button id='remove-link-vnode' class='delete-port btn btn-danger btn-xs' onclick='remove_link("+k+")'>Remove</button></td></tr>";
            $('#balloon-links-list').append(row);   
        }
    }
}

$(function() {
    $.ajaxSetup({
        data: {csrfmiddlewaretoken: window.CSRF_TOKEN},
    });
    /* If there's no topology request create a new one */
    if (localStorage.nodes == null) {
        var options = get_topology_options();
        nodes = new vis.DataSet();
        edges = new vis.DataSet();
        request = {
            tenantID: "",
            vnodes: [],
            vlinks: [],
        };
        topology = {
            nodes: nodes,
            edges: edges
        };
        container = document.getElementById('network');
        network = new vis.Network(container, topology, options);
        network.fit();
    } /* Otherwise, load it*/ 
    else {
        load_topology();
    }
    network.on("click", function (params) {
        info_listener(params);
    });
});
