// ==UserScript==
// @name         Better Eats
// @namespace    https://github.com/pxue/better-eats
// @version      0.1
// @description  try to take over the world!
// @author       pxue
// @match        https://www.ubereats.com/ca/feed*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=ubereats.com
// @grant        none
// @require      http://code.jquery.com/jquery-3.6.0.min.js
// @require      https://raw.githubusercontent.com/uzairfarooq/arrive/master/minified/arrive.min.js
// ==/UserScript==

(function () {
  "use strict";

  jQuery.noConflict();

  console.log("loading");

  const raw = window.localStorage.getItem("ubereats");
  const storedData = raw
    ? JSON.parse(raw)
    : { ratingMin: 4.5, bogoOnly: false, excludeList: [] };
  if (!raw) {
    window.localStorage.setItem("ubereats", JSON.stringify(storedData));
  }

  jQuery(document).ready(function ($) {
    console.log("loaded better eats script");

    let itemClass = "";
    function autoFilterItems(el) {
      if (itemClass === "") {
        itemClass = $(el).attr("class");
      }

      let shouldHide = false;

      const ahref = $("a", el);
      // 1. check name filters
      for (let ex of storedData.excludeList) {
        if (ahref.attr("href").includes(ex)) {
          shouldHide = true;
        }
      }

      // 2. check bogo
      if (storedData.bogoOnly) {
        const perkDiv = $("> div > div", ahref.next()).eq(0);
        if (!perkDiv.text().toLowerCase().includes("buy 1, get 1 free")) {
          shouldHide = true;
        }
      }

      const deetDiv = $("> div > div", ahref.next()).eq(1);
      $("div", $(deetDiv)).each(function () {
        // 3. check ratings
        const text = $(el).text().trim();
        if (!text) {
          return;
        }
        const rating = text.match(/\d(.\d+)?(?= out of \d stars)/g);
        if (rating?.length) {
          if (parseFloat(rating[0]) < parseFloat(storedData.ratingMin)) {
            shouldHide = true;
            return;
          }
        }
      });

      if (shouldHide) {
        $(el).hide();
      } else if (!shouldHide && $(el).is(":hidden")) {
        $(el).show();
      }
    }

    var observer = new MutationObserver(function (mutations) {
      let count = 0;
      mutations.forEach(function (mutation) {
        if (mutation.addedNodes && mutation.addedNodes.length > 0) {
          // element added to DOM
          mutation.addedNodes.forEach(function (el) {
            if (itemClass === "" || $(el).attr("class") === itemClass) {
              autoFilterItems(el);
              count++;
            }
          });
        }
      });
      console.log(`processed: ${count} items`);
    });

    $(document).arrive("div[data-test='feed-desktop']", function () {
      // 'this' refers to the newly created element
      var mainFeed = $(this);
      mainFeed.css("grid-template-columns", "repeat(5, 1fr)");
      mainFeed.css("gap", "20px 8px");
      console.log("mainfeed arrived!", mainFeed[0]);

      $("> div", mainFeed).each(function () {
        autoFilterItems($(this));
      });

      observer.observe(mainFeed[0], {
        attributes: true,
        childList: true,
        characterData: true,
      });
    });

    setTimeout(() => {
      const mainContent = $("#main-content");
      const mainFeed = $("div[data-test='feed-desktop']");
      const sidebar = $("> div > div > div:first", mainContent);
      sidebar
        .parent()
        .append(`<div id="better-filters"><h1>Better filters</h1></div>`);
      const filters = $("#better-filters");
      filters.addClass(sidebar.attr("class"));

      function appendBogoFilter() {
        const bogoFilter = $(`
          <div style="display:flex; justify-content: space-between;">
             Buy 1, Get 1
             <input type="checkbox" />
          </div>
        `);
        // copy a checkbox component
        filters.append(bogoFilter);
        filters.append("<div style='margin-bottom: 18px' />");

        const input = $("input:checkbox", bogoFilter);
        input.attr("checked", storedData.bogoOnly);
        input.on("click", function () {
          $(this).attr("checked", !$(this).attr("checked"));
          storedData.bogoOnly = $(this).is(":checked");
          window.localStorage.setItem("ubereats", JSON.stringify(storedData));
          $("> div", mainFeed).each(function () {
            autoFilterItems($(this));
          });
        });
      }
      appendBogoFilter();

      function appendExclusionFilter() {
        const exclusionFilter = document.createElement("div");
        exclusionFilter.style.display = "flex";
        exclusionFilter.style["flex-direction"] = "column";
        exclusionFilter.append("Black list");
        const excludeTextArea = document.createElement("textarea");

        excludeTextArea.setAttribute("rows", 20);
        excludeTextArea.setAttribute("id", "excludeList");
        excludeTextArea.style.width = "100%";
        exclusionFilter.append(excludeTextArea);
        exclusionFilter.style["margin-bottom"] = "12px";

        jQuery(excludeTextArea).val(storedData.excludeList.join("\n"));
        jQuery(excludeTextArea).on("blur", function () {
          storedData.excludeList = $(this).val().split("\n");
          window.localStorage.setItem("ubereats", JSON.stringify(storedData));
          $("> div", mainFeed).each(function () {
            autoFilterItems($(this));
          });
        });
        filters.append(exclusionFilter);
      }
      appendExclusionFilter();

      function appendRatingFilter() {
        const ratingFilter = document.createElement("div");
        ratingFilter.style.display = "flex";
        ratingFilter.style["flex-direction"] = "column";
        ratingFilter.style["margin-bottom"] = "12px";
        ratingFilter.append("Ratings");

        const ratingInput = jQuery(
          `<div style="display:flex;">
             Minimum:
             <input id="ratingMin" type="number" style="border: 1px solid #000" />
           </div>`
        );

        ratingFilter.append(ratingInput[0]);
        filters.append(ratingFilter);

        jQuery("#ratingMin").val(storedData.ratingMin);
        jQuery("#ratingMin").on("blur", function () {
          storedData.ratingMin = parseFloat($(this).val());
          window.localStorage.setItem("ubereats", JSON.stringify(storedData));
          $("> div", mainFeed).each(function () {
            autoFilterItems($(this));
          });
        });
      }
      appendRatingFilter();
    }, 2500);

    console.log("Ready");
  });
})();
