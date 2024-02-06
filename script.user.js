// ==UserScript==
// @name         Better Eats
// @namespace    https://github.com/pxue/better-eats
// @version      0.1
// @description  try to take over the world!
// @author       pxue
// @match        https://www.ubereats.com/*feed*
// @match        https://www.ubereats.com/*store*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=ubereats.com
// @grant        none
// @require      http://code.jquery.com/jquery-3.6.0.min.js
// @require      https://raw.githubusercontent.com/uzairfarooq/arrive/master/minified/arrive.min.js
// ==/UserScript==

(function () {
  "use strict";

  jQuery.noConflict();

  console.log("loading");
  const debug = true;

  const deelsStrs = {
    bogoOnly: "buy 1, get 1 free",
    spend10Get8: "spend $10, save $8",
  };

  const raw = window.localStorage.getItem("ubereats");
  const storedData = raw
    ? JSON.parse(raw)
    : {
        // ratingMin: 4.5,
        bogoOnly: false,
        spend10Get8: false,
        deliveryTimeMax: 0,
        excludeList: [],
      };
  if (!raw) {
    window.localStorage.setItem("ubereats", JSON.stringify(storedData));
  }

  jQuery(document).ready(function ($) {
    let itemClass = "";
    function autoFilterItems(el) {
      if (itemClass === "") {
        itemClass = $(el).attr("class");
      }

      function checkShouldHide() {
        const ahref = $("a", el);
        // 1. check name filters
        for (let ex of storedData.excludeList) {
          if (ahref.attr("href").includes(ex)) {
            return [true, "exclude"];
          }
        }

        function checkDeel(key) {
          const perkDiv = $("> div > div:nth-child(2)", ahref.next()).eq(0);
          if (perkDiv.text().toLowerCase().includes(key)) {
            return true;
          }
          return false;
        }

        // 2. check deels
        const deelsCheck = Object.keys(deelsStrs)
          .map((k) => (storedData[k] ? checkDeel(deelsStrs[k]) : null))
          .filter((v) => v !== null);
        if (deelsCheck?.length && deelsCheck.every((v) => !v)) {
          return [true, "deal"];
        }

        // 4. check delivery time
        const shouldHideDelivery = () => {
          const div = $(
            "> div:nth-child(2) > div:nth-child(2) > div",
            ahref.next()
          ).eq(1);
          const text = $("span[aria-hidden=true]", $(div)).text().trim();
          if (!text) {
            return false;
          }
          const timing = text.split(" ");
          if (timing.length > 0) {
            if (
              parseFloat(timing[0]) > parseFloat(storedData.deliveryTimeMax)
            ) {
              return true;
            }
          }
        };

        if (shouldHideDelivery()) {
          return [true, "deliveryTime"];
        }

        return [false, ""];
      }

      const [shouldHide, reason] = checkShouldHide();
      if (shouldHide) {
        // d(`shouldHide: ${reason}`);
        $(el).hide();
        return;
      }
      if (!shouldHide && $(el).is(":hidden")) {
        $(el).show();
      }

      // $(el).hover(
      // () => {
      // const position = $(el).position();
      // const width = $(el).width();
      // const height = $(el).height();
      // const href = $("a", el).attr("href");

      // let iframe;
      // function appendPreviewIframe() {
      // const iframePopup = $(`
      // <div id="framePopup" style="position:absolute; top:${
      // position.top + height
      // }px; left:${position.left + width}px; width:900px; height:450px">
      // </div>
      // `);

      // iframe = $(
      // `<iframe id="previewFrame" style="width:100%; height:100%"/>`
      // );
      // $(iframePopup).append(iframe);

      // $("body").append(iframePopup);
      // }
      // appendPreviewIframe();

      // setTimeout(() => {
      // console.log(iframe);
      // $(iframe).attr("src", href);
      // }, 250);
      // },
      // () => {
      // $("#framePopup").remove();
      // }
      // );
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

    setTimeout(() => {
      console.log("main content arrived");
      const mainContent = $("#main-content");
      const mainFeed = $("div[data-test='feed-desktop']");
      const ogButtonGroup = $("div[role='group']", mainContent);
      const buttonGroup = ogButtonGroup.clone();
      const buttonTmp = $("button:first", buttonGroup).clone();
      ogButtonGroup.parent().append(buttonGroup);
      ogButtonGroup.parent().attr("style", "flex-direction: column; gap: 10px");
      buttonGroup.empty();

      function appendBogoFilter() {
        const bogoFilter = buttonTmp.clone();
        bogoFilter.attr("id", "bogoFilter");
        bogoFilter.contents()[1].textContent = "Buy 1, Get 1";
        buttonGroup.append(bogoFilter);
        bogoFilter.wrap("<div></div");

        bogoFilter.on("click", function () {
          storedData.bogoOnly = !storedData.bogoOnly;
          bogoFilter.attr(
            "style",
            storedData.bogoOnly
              ? "background-color: black; color: white;"
              : "background-color: white; color: black;"
          );
          window.localStorage.setItem("ubereats", JSON.stringify(storedData));
          $("> div", mainFeed).each(function () {
            autoFilterItems($(this));
          });
        });
      }
      appendBogoFilter();

      function appendSpend10Get8Filter() {
        const sp10Filter = buttonTmp.clone();
        sp10Filter.attr("id", "sp10");
        sp10Filter.contents()[1].textContent = "Spend $10, Get $8";
        buttonGroup.append(sp10Filter);
        sp10Filter.wrap("<div></div");

        sp10Filter.on("click", function () {
          storedData.spend10Get8 = !storedData.spend10Get8;
          sp10Filter.attr(
            "style",
            storedData.spend10Get8
              ? "background-color: black; color: white;"
              : "background-color: white; color: black;"
          );
          window.localStorage.setItem("ubereats", JSON.stringify(storedData));
          $("> div", mainFeed).each(function () {
            autoFilterItems($(this));
          });
        });
      }
      appendSpend10Get8Filter();

      function appendDeliveryTimeFilter() {
        const filter = document.createElement("div");
        filter.style.display = "flex";
        filter.style["flex-direction"] = "column";
        filter.style["margin-bottom"] = "12px";
        filter.append("Delivery time");

        const input = jQuery(
          `<div style="display:flex;">
        Max delivery time:
        <input id="deliveryTimeMax" type="number" style="border: 1px solid #000" />
        </div>`
        );

        filter.append(input[0]);
        buttonGroup.append(filter);

        jQuery("#deliveryTimeMax").val(storedData.deliveryTimeMax);
        jQuery("#deliveryTimeMax").on("blur", function () {
          storedData.deliveryTimeMax = parseFloat($(this).val());
          window.localStorage.setItem("ubereats", JSON.stringify(storedData));
          $("> div", mainFeed).each(function () {
            autoFilterItems($(this));
          });
        });
      }
      appendDeliveryTimeFilter();

      function appendExclusionFilter() {
        const exclusionFilter = document.createElement("div");
        exclusionFilter.style.display = "flex";
        exclusionFilter.style["flex-direction"] = "column";
        exclusionFilter.append("Black list");

        const filterSubtitle = document.createElement("span");
        filterSubtitle.style["font-size"] = "12px";
        filterSubtitle.textContent =
          "use this list to hide restaurants you do not want to see, one per line";
        exclusionFilter.append(filterSubtitle);
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
        buttonGroup.append(exclusionFilter);
      }
      appendExclusionFilter();

      function appendApplyButton() {
        const button = document.createElement("button");
        button.id = "reload";
        button.textContent = "Apply filters";
        button.style["border"] = "1px solid #000";
        button.style["background-color"] = "rgb(238, 238, 238)";
        button.style["font-size"] = "14px";
        button.style["font-weight"] = "500";
        button.style["padding"] = "6px 12px";
        buttonGroup.append(button);
        $(button).wrap("<div></div>");

        jQuery("#reload").click(function () {
          location.reload();
        });
      }
      appendApplyButton();
    }, 2500);

    $("main").arrive(
      "div[data-test='feed-desktop']",
      { onlyOnce: true },
      function () {
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
      }
    );

    if (self !== top) {
      setTimeout(() => {
        const deals = [];
        $("div[data-testid^='store-menu-item']").each(function () {
          const parentThis = $(this);
          $("span[data-testid='rich-text']", $(this)).each(function () {
            const textContent = $(this)?.text?.();
            if (textContent && textContent.includes("Buy 1, Get 1 Free")) {
              deals.push(parentThis.clone());
            }
          });
        });

        $("body").empty();
        $("body").css("display", "flex");

        for (let d of deals) {
          $(d).css("width", "fit-content");
          $("body").append(d);
        }
      }, 500);
    }

    console.log("Ready");
  });

  function d(msg) {
    if (debug) {
      console.log(msg);
    }
  }
})();
