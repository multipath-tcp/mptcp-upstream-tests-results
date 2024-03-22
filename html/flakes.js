/*  Inspired by NIPA's flakes: https://github.com/linux-netdev/nipa */
function colorify(cell, result)
{
  var ret;
  var cmt;

  if (result == null || !("result" in result)) {
    ret = "";
    cmt = null;
  } else {
    ret = result.result;
    cmt = result.comment;
  }

  if (ret == "") { // We only track failed tests: assumed they were OK
    style = "background-color:green";
  } else if (ret == "skip") {
    style = "background-color:blue";
  } else {
    style = "background-color:red";
  }
  cell.setAttribute("style", style);

  if (cmt != null) {
    cell.setAttribute("title", cmt);
    cell.setAttribute("data-toggle", "tooltip");
  }
}

function load_result_table(data_raw, table_name)
{
  // Get all tags names
  var tags = new Array();
  $.each(data_raw, function(i, item) {
    tags.push([item.tag, item.run_id]);
  });
  tags.reverse();

  var test_row = {};
  var tags_errors = new Set();

  /* Format:
    [{"results":
        {"<file>":
          {<id>:
            {"result": "<pass/fail>", "name": "<name>", "comment": "<cmt>"}
          }
        }
      "run_id": "<run_id>",
      "tag": "<tag>"
    }]
   */
  $.each(data_raw, function(i, item) {
    if (!("results" in item)) {
      tags_errors.add(item.tag);
      return true;
    }

    $.each(item.results, function(file, tests) {
      $.each(tests, function(id, result) {
        tn = result.name;
        if (!(tn in test_row)) {
          test_row[tn] = {};
          for (let i = 1; i <= tags.length; i++)
            test_row[tn][tags[i - 1][0]] = null;
        }
        test_row[tn][item.tag] = {
          "result": result.result,
          "comment": result.comment
        };
      });
    });
  });

  // Remove all rows but first (leave headers)
  $("#results-" + table_name + " tr").remove();
  // Display
  let table = document.getElementById("results-" + table_name);

  let header = table.insertRow();
  header.insertCell(0); // name
  for (let i = 0; i < tags.length; i++) {
    let cell = header.insertCell(i + 1);
    cell.innerHTML = "<a href=\"https://github.com/multipath-tcp/mptcp_net-next/actions/runs/" + tags[i][1] + "\" target=\"_blank\">" + tags[i][0] + "</a>";
    cell.setAttribute("style", "writing-mode: tb-rl; font-size: 1em; padding: 0px;");
  }

  for (let tn in test_row) {
    let row = table.insertRow();
    let name = row.insertCell(0);

    name.innerHTML = tn;
    name.setAttribute("style", "padding: 0px");

    for (let i = 0; i < tags.length; i++) {
      let cell = row.insertCell(i + 1);
      if (tags[i][0] in tags_errors)
        colorify(cell, {"result": "fail", "comment": "Global error"});
      else
        colorify(cell, test_row[tn][tags[i][0]]);
    }
  }
}

let xfr_todo = 3;

function remove_loading()
{
  if (--xfr_todo > 0)
    return;

  let warn_box = document.getElementById("fl-warn-box");
  warn_box.innerHTML = "";
}

function load_result_table_normal(data_raw)
{
  load_result_table(data_raw, "normal");
  remove_loading();
}

function load_result_table_debug(data_raw)
{
  load_result_table(data_raw, "debug");
  remove_loading();
}

function load_result_table_btf(data_raw)
{
  load_result_table(data_raw, "btf");
  remove_loading();
}

let matched = false;

function do_it()
{
  $(document).ready(function() {
    var matches = /branch=([a-z-]+)/.exec(window.location.search);
    var selector = document.getElementById("branch");
    var path;

    if (!matched && matches)
      selector.value = matches[1];
    matched = true;

    path = "results/" + selector.value;

    $.get(path + "/normal.json", load_result_table_normal);
    $.get(path + "/debug.json", load_result_table_debug);
    $.get(path + "/btf.json", load_result_table_btf);
  });
}
