var changeSetTable = null;
var typeColumn = null;
var nameColumn = null;
var numCallsInProgress = 0;

var entityTypeMap = {
    'TabSet': 'CustomApplication',
    'ApexClass': 'ApexClass',
    'ApexComponent': 'ApexComponent',
    'ApexPage': 'ApexPage',
    'ApexTrigger': 'ApexTrigger',
    'AssignmentRule': 'AssignmentRules',
    'AuraDefinitionBundle': 'AuraDefinitionBundle',
    'AuthProvider': 'AuthProvider',
    'AutoResponseRule': 'AutoResponseRules',
    'CallCenter': 'CallCenter',
    'Community': 'Community',
    'CompactLayout': 'CompactLayout',
    'CorsWhitelistEntry': 'CorsWhitelistOrigin',
    'CustomEntityDefinition': 'CustomObject',
    'CustomFieldDefinition': 'CustomField',
    'CustomObjectCriteriaSharingRule': 'SharingCriteriaRule',
    'CustomReportType': 'ReportType',
    'CustomShareRowCause': 'SharingReason',
    'CustomTabDefinition': 'CustomTab',
    'Dashboard': 'Dashboard',
    'Document': 'Document',
    'EmailTemplate': 'EmailTemplate',
    'FieldSet': 'FieldSet',
    'FlexiPage': 'FlexiPage',
    'FlowDefinition': 'FlowDefinition',
    'Group': 'Group',
    'Layout': 'Layout',
    'LightningComponentBundle': 'LightningComponentBundle',
    'ListView': 'ListView',
    'MatchingRule': 'MatchingRule',
    'NamedCredential': 'NamedCredential',
    'PageComponent': 'HomePageComponent',
    'PermissionSet': 'PermissionSet',
    'PlatformCachePartition': 'PlatformCachePartition',
    'ProcessDefinition': 'ApprovalProcess',
    'Queues': 'Queue',
    'QuickActionDefinition': 'QuickAction',
    'RecordType': 'RecordType',
    'SharedPicklistDefinition': 'GlobalValueSet',
    'SharingSet': 'SharingSet',
    'Site': 'SiteDotCom',
    'StaticResource': 'StaticResource',
    'ValidationFormula': 'ValidationRule',
    'WebLink': 'WebLink',
    'WorkflowRule': 'WorkflowRule',
    'ActionFieldUpdate': 'WorkflowFieldUpdate',
    'ActionTask': 'WorkflowTask',
    'ActionEmail': 'WorkflowAlert',
    'Report': 'Report',
    'ExternalString': 'CustomLabel',
};

var entityFolderMap = {
    'Report': 'ReportFolder',
    'Document': 'DocumentFolder',
    'EmailTemplate': 'EmailFolder',
    'Dashboard': 'DashboardFolder'
};

function setupTable() {
    typeColumn = $("table.list>tbody>tr.headerRow>th>a:contains('Type')");
    nameColumn = $("table.list>tbody>tr.headerRow>th>a:contains('Name')");

    if (typeColumn.length == 0) {
        $("table.list tr.headerRow").append("<td>&nbsp;</td>");
        $("table.list tr.dataRow").append("<td>&nbsp;</td>");
    }
    $("table.list tr.headerRow").append("<td>Folder</td>");
    $("table.list tr.headerRow").append("<td>Date Modified</td>");
    $("table.list tr.headerRow").append("<td>Modified by</td>");
    $("table.list tr.headerRow").append("<td><span class='compareOrgName'></span> Date Modified</td>");
    $("table.list tr.headerRow").append("<td><span class='compareOrgName'></span> Modified by</td>");
    $("table.list tr.headerRow").append("<td>Full name</td>");

    $("table.list tr.dataRow").append("<td>Unknown</td>");
    $("table.list tr.dataRow").append("<td>Unknown</td>");
    $("table.list tr.dataRow").append("<td>Unknown</td>");
    $("table.list tr.dataRow").append("<td>&nbsp;</td>");
    $("table.list tr.dataRow").append("<td>&nbsp;</td>");
    $("table.list tr.dataRow").append("<td>Unknown</td>");

    var changeSetHead = $('<thead></thead>').prependTo('table.list').append($('table.list tr:first'));
    changeSetHead.after('<tfoot><tr><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr></tfoot>');

    var gotoloc1 = "'/" + $("#id").val() + "?tab=PackageComponents&rowsperpage=" + Number.MAX_SAFE_INTEGER + "'";
    $('input[name="cancel"]')
        .before('<input value="View change set" class="btn" name="viewall" title="View all items in changeset in new window" type="button" onclick="window.open(' + gotoloc1 +',\'_blank\');" />')
        .after(`<br /><input value="Compare with org" class="btn compareorg" name="compareorg" id="compareorg" 
                    title="Compare wtih another org. A login box will be displayed." type="button" />
        <select id='compareEnv' name='Compare Environment'>
            <option value='sandbox'>Sandbox</option>
            <option value='prod'>Prod/Dev</option>
        </select> 
    <span id="loggedInUsername"></span>  <span id="logout">(<a id="logoutLink" href="#">Logout</a>)</span>
`);

    $('#editPage').append('<input type="hidden" name="rowsperpage" value="' + Number.MAX_SAFE_INTEGER + '" /> ');
}

function loadAllData() {
    let offset = 0;
    const batchSize = 1000;
    let hasMore = true;

    function loadBatch() {
        $.ajax({
            url: serverUrl + '/p/mfpkg/AddToPackageFromChangeMgmtUi',
            data: {
                rowsperpage: batchSize,
                isdtp: 'mn',
                lsr: offset,
                id: changeSetId,
                entityType: selectedEntityType
            },
            success: function(data) {
                const parsedResponse = $(data);
                const nextTable = parsedResponse.find("table.list tr.dataRow");
                nextTable.appendTo("table.list");
                
                if (nextTable.length < batchSize) {
                    hasMore = false;
                } else {
                    offset += batchSize;
                }

                if (hasMore) {
                    setTimeout(loadBatch, 100); // Add a small delay to prevent overwhelming the server
                } else {
                    finishLoading();
                }
            },
            error: function() {
                console.error("Error loading data");
                finishLoading();
            }
        });
    }

    loadBatch();
}

function finishLoading() {
    if (selectedEntityType in entityTypeMap) {
        setupTable();
        $("#editPage").addClass("lowOpacity");
        $("#bodyCell").addClass("changesetloading");

        chrome.runtime.sendMessage({
            "oauth": "connectToLocal",
            "sessionId": sessionId,
            "serverUrl": serverUrl
        }, function (response) {
            getMetaData(processListResults);
        });
    } else {
        setupBasicTable();
    }
}

function setupBasicTable() {
    typeColumn = $("table.list>tbody>tr.headerRow>th>a:contains('Type')");
    nameColumn = $("table.list>tbody>tr.headerRow>th>a:contains('Name')");

    var changeSetHead2 = $('<thead></thead>').prependTo('table.list').append($('table.list tr:first'));
    if (typeColumn.length > 0) {
        changeSetHead2.after('<tfoot><tr><td></td><td></td><td></td></tr></tfoot>');
    } else {
        changeSetHead2.after('<tfoot><tr><td></td><td></td></tr></tfoot>');
    }

    changeSetTable = $('table.list').DataTable({
        paging: false,
        dom: 'lrti',
        "order": [[1, "asc"]],
        initComplete: basicTableInitComplete,
        deferRender: true,
        orderClasses: false
    });

    addCommonElements();
}

function addCommonElements() {
    $('<input style="float: left;" value="Reset Search Filters" class="clearFilters btn" name="Reset Search Filters" title="Reset search filters" type="button" />').prependTo('div.rolodex');
    $('#editPage').append('<input type="hidden" name="rowsperpage" value="' + Number.MAX_SAFE_INTEGER + '" />');

    var gotoloc2 = "'/" + $("#id").val() + "?tab=PackageComponents&rowsperpage=" + Number.MAX_SAFE_INTEGER + "'";
    $('input[name="cancel"]').before('<input value="View change set" class="btn" name="viewall" title="View all items in changeset in new window" type="button" onclick="window.open(' + gotoloc2 + ',\'_blank\');" />');
}

function convertDate(dateToconvert) {
    var momentDate = new moment(dateToconvert);
    return momentDate.format("DD MMM YYYY");
}

function convertToMoment(stringToconvert) {
    var momentDate = new moment(stringToconvert, "DD MMM YYYY");
    return momentDate;
}

function processListResults(response) {
    var results = [];
    if (response.results && !Array.isArray(response.results)) {
        results.push(response.results);
    } else {
        results = response.results;
    }
    var len = results ? results.length : 0;

    for (i = 0; i < len; i++) {
        shortid = results[i].id.slice(0, -3);
        var matchingInput = $("input[value='" + shortid + "']");
        dateMod = new Date(results[i].lastModifiedDate);
        var fullName = results[i].fullName;
        var folderName = fullName.substring(0, fullName.lastIndexOf("/"));
        dateCreate = new Date(results[i].createdDate);

        matchingInput.first().closest('tr').children('td:eq(2)').text(folderName);
        matchingInput.first().closest('tr').children('td:eq(3)').text(convertDate(dateMod));
        matchingInput.first().closest('tr').children('td:eq(4)').text(results[i].lastModifiedByName);
        matchingInput.first().closest('tr').children('td:eq(7)').text(fullName);
        matchingInput.first().closest('tr').children('td:eq(7)').attr("data-fullName", fullName);
        matchingInput.first().closest('tr').children('td:eq(7)').addClass("fullNameClass");
    }
    numCallsInProgress--;
    if (numCallsInProgress <= 0) {
        createDataTable();
    }
}

function createDataTable() {
    var hasFolder = selectedEntityType in entityFolderMap;
    try {
        changeSetTable = $('div.bPageBlock > div.pbBody > table.list').DataTable({
            paging: false,
            dom: 'lrti',
            "order": [[4, "desc"]],
            "columns": [
                {"searchable": false, "orderable": false},
                null,
                {"visible": typeColumn.length > 0},
                {"visible": hasFolder},
                {"type": "date"},
                null,
                {"type": "date", "visible": false},
                {"visible": false},
                null
            ],
            initComplete: tableInitComplete,
            deferRender: true,
            orderClasses: false
        });

        $('<input style="float: left;"  value="Reset Search Filters" class="clearFilters btn" name="Reset Search Filters" title="Reset search filters" type="button" />').prependTo('div.rolodex');
        $(".clearFilters").click(clearFilters);
        $("#editPage").submit(function (event) {
            clearFilters();
            return true;
        });
    } catch (e) {
        console.log(e);
    }

    $("#editPage").removeClass("lowOpacity");
    $("#bodyCell").removeClass("changesetloading");
}

function clearFilters() {
    changeSetTable
        .columns().search('')
        .draw();
    $(".dtsearch").val('');
}

function basicTableInitComplete() {
    this.api().columns().every(function () {
        var column = this;
        if ((column.index() == 1)) {
            var searchbox = $('<input class="dtsearch" type="text" placeholder="Search" />')
                .appendTo($(column.footer()))
                .on('keyup change', function () {
                    column
                        .search($(this).val())
                        .draw();
                });
        }

        if ((column.index() == 2)) {
            var select = $('<select class="dtsearch"><option value=""></option></select>')
                .appendTo($(column.footer()))
                .on('change', function () {
                    var val = $.fn.dataTable.util.escapeRegex(
                        $(this).val()
                    );

                    column
                        .search(val ? '^' + val + '$' : '', true, false)
                        .draw();
                })

            column.data().unique().sort().each(function (d, j) {
                select.append('<option value="' + d + '">' + d + '</option>')
            });
        }
    });
}

function tableInitComplete() {
    this.api().columns().every(function () {
        var column = this;
        if ((column.index() == 2) || column.index() == (3) || column.index() == (5) || column.index() == (7)) {
            var select = $('<select class="dtsearch" ><option value=""></option></select>')
                .appendTo($(column.footer()))
                .on('change', function () {
                    var val = $.fn.dataTable.util.escapeRegex(
                        $(this).val()
                    );

                    column
                        .search(val ? '^' + val + '$' : '', true, false)
                        .draw();
                })

            column.data().unique().sort().each(function (d, j) {
                select.append('<option value="' + d + '">' + d + '</option>')
            });
        }

        if ((column.index() == 1) || column.index() == (8) || column.index() == (6) || column.index() == (4)) {
            var searchbox = $('<input class="dtsearch" type="text" placeholder="Search" />')
                .appendTo($(column.footer()))
                .on('keyup change', function () {
                    column
                    .search($(this).val())
                    .draw();
            });
    }
});
}

function getMetaData(processResultsFunction) {
if (selectedEntityType in entityFolderMap) {
    $(".compareorg").hide();
    var data = [{type: entityFolderMap[selectedEntityType]}];
    chrome.runtime.sendMessage({'proxyFunction': "listLocalMetaData", 'proxydata': data},
        function (response) {
            results = response.results;

            var folderQueries = [];
            var n = 0;
            for (i = 0; i < results.length; i++) {
                n++;
                folderName = results[i].fullName;
                var folderQuery = {};
                folderQuery.type = entityTypeMap[selectedEntityType];
                folderQuery.folder = folderName;
                folderQueries.push(folderQuery);
                if (n == 3) {
                    numCallsInProgress++;
                    chrome.runtime.sendMessage({
                            'proxyFunction': "listLocalMetaData",
                            'proxydata': folderQueries
                        },
                        processResultsFunction
                    );

                    folderQueries = [];
                    n = 0;
                }
            }

            if (n > 0) {
                numCallsInProgress++;
                chrome.runtime.sendMessage({
                        'proxyFunction': "listLocalMetaData",
                        'proxydata': folderQueries
                    },
                    processResultsFunction
                );
            }
        }
    );
} else {
    numCallsInProgress++;
    chrome.runtime.sendMessage({
            'proxyFunction': "listLocalMetaData",
            'proxydata': [{type: entityTypeMap[selectedEntityType]}]
        },
        processResultsFunction
    );
}
}

function listMetaDataProxy(data, retFunc, isDefault) {
if (isDefault) {
    chrome.runtime.sendMessage({'proxyFunction': "listLocalMetaData", 'proxydata': data}, function (response) {
        retFunc(response.results);
    });
} else {
    chrome.runtime.sendMessage({'proxyFunction': "listDeployMetaData", 'proxydata': data}, function (response) {
        retFunc(response.results);
    });
}
}

function oauthLogin(env) {
var env = $("#compareEnv :selected").val();

chrome.runtime.sendMessage({'oauth': "connectToDeploy", environment: env}, function (response) {
    $("#compareEnv").hide();

    $("#loggedInUsername").html(response.username);
    $("#logout").show();

    listMetaDataProxy([{type: entityTypeMap[selectedEntityType]}],
        function (results) {
            if (results.error) {
                console.log("Problem logging in: " + results.error);
            }
            $("#editPage").addClass("lowOpacity");
            $("#bodyCell").addClass("changesetloading");

            processCompareResults(results, env);
        },
        false);
});
}

function getContents() {
var itemToGet = $(this).attr('data-fullName');
chrome.runtime.sendMessage({
        'proxyFunction': "compareContents",
        'entityType': entityTypeMap[selectedEntityType],
        'itemName': itemToGet
    },
    function (response) {
        //do nothing
    }
);
}

function deployLogout() {
chrome.runtime.sendMessage({'oauth': 'deployLogout'}, function(response) {
    //do nothing else
});

$("#compareEnv").show();
$("#loggedInUsername").html('');
$("#logout").hide();
}

function processCompareResults(results, env) {
changeSetTable.column(2).visible(true);
changeSetTable.column(6).visible(true);
changeSetTable.column(7).visible(true);
if (env == 'prod') {
    $('.compareOrgName').text('(Prod/Dev)');
} else {
    $('.compareOrgName').text('(Sandbox)');
}
$(changeSetTable.column(8).header()).text('Full name (Click for diff)');

for (i = 0; i < results.length; i++) {
    var fullName = results[i].fullName;
    var matchingInput = $('td[data-fullName = "' + fullName + '"]');
    if (matchingInput.length > 0) {
        var rowIdx = changeSetTable.cell('td[data-fullName = "' + fullName + '"]').index().row;

        dateMod = new Date(results[i].lastModifiedDate);
        changeSetTable.cell(rowIdx, 6).data(convertDate(dateMod));
        changeSetTable.cell(rowIdx, 7).data(results[i].lastModifiedByName);
        changeSetTable.cell(rowIdx, 8).data('<a href="#">' + fullName + '</a>');
        matchingInput.off("click");
        matchingInput.click(getContents);

        var thisOrgDateMod = changeSetTable.cell(rowIdx, 4).data();
        if (moment(dateMod).diff(convertToMoment(thisOrgDateMod)) < 0) {
            changeSetTable.cell(rowIdx, 4).node().style.color = "green";
        }
    }
}
changeSetTable.column(2).visible(false);
var column = changeSetTable.column(7);
var select = $(column.footer()).find('select');

select.find('option')
    .remove()
    .end()
    .append('<option value=""></option>');

column.data().unique().sort().each(function (d, j) {
    select.append('<option value="' + d + '">' + d + '</option>')
});

$("#editPage").removeClass("lowOpacity");
$("#bodyCell").removeClass("changesetloading");
}

// Main execution
var selectedEntityType = $('#entityType').val();
var changeSetId = $("#id").val();

loadAllData();

$(document).ready(function () {
$(".clearFilters").click(clearFilters);
$("#logoutLink").click(deployLogout);

$("#editPage").submit(function (event) {
    clearFilters();
    return true;
});
$("#compareorg").click(oauthLogin);

if (!sessionId) {
    $('.bDescription').append('<span style="background-color:yellow"><strong><br/> <br/>Sorry, currently for the Change Set Helper to work, please UNSET the Require HTTPOnly Attribute checkbox in Security -> Session Settings. Then logout and back in again.  </strong></span>')
}
});

// Find out if they are logged in already
chrome.runtime.sendMessage({'proxyFunction': 'getDeployUsername'}, function(username) {
console.log(username);
if (username) {
    // Then there is a logged in deploy user
    $("#compareEnv").hide();
    $("#loggedInUsername").html(username);
    $("#logout").show();
} else {
    $("#compareEnv").show();
    $("#loggedInUsername").html('');
    $("#logout").hide();
}
});