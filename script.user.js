// ==UserScript==
// @name         Better Eats
// @namespace    https://github.com/pxue/better-eats
// @version      0.2
// @description  try to take over the world!
// @author       pxue
// @match        https://www.ubereats.com/*feed*
// @match        https://www.ubereats.com/*store*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=ubereats.com
// @resource     FRANKEN_CSS https://unpkg.com/franken-wc@0.0.6/dist/css/slate.min.css
// @require      http://code.jquery.com/jquery-3.6.0.min.js
// @require      https://cdn.jsdelivr.net/npm/uikit@3.21.6/dist/js/uikit.min.js
// @require      https://cdn.jsdelivr.net/npm/uikit@3.21.6/dist/js/uikit-icons.min.js
// @require      https://raw.githubusercontent.com/uzairfarooq/arrive/master/minified/arrive.min.js
// @require      file:///Users/paul/dev/better-eats/script.user.js
// @grant        GM_getResourceText
// @grant        GM_addStyle
// ==/UserScript==

(function () {
  "use strict";

  jQuery.noConflict();

  // Load remote CSS
  // @see https://github.com/Tampermonkey/tampermonkey/issues/835
  const myCss = GM_getResourceText("FRANKEN_CSS");
  GM_addStyle(myCss);

  console.log("loading");
  const debug = true;

  // deal strings
  const deelsStrs = {
    bogoOnly: "Buy 1, Get 1 Free",
    spend10Get8: "Spend $10, Save $8",
    hasOffers: "Offers Available",
  };

  // util functions
  jQuery.expr[":"].icontains = jQuery.expr.createPseudo(function (arg) {
    return function (elem) {
      return jQuery(elem).text().toUpperCase().indexOf(arg.toUpperCase()) >= 0;
    };
  });

  // initialize storage
  const raw = window.localStorage.getItem("ubereats");
  const storedData = raw
    ? JSON.parse(raw)
    : {
        // ratingMin: 4.5,
        bogoOnly: false,
        spend10Get8: false,
        hasOffers: false,
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
        // 1. check name filters
        for (let ex of storedData.excludeList) {
          if ($("a", el).attr("href").includes(ex)) {
            return [true, "exclude"];
          }
          if ($(`div:icontains('${ex}'):not(:has(div))`, el).length > 0) {
            return [true, "exclude"];
          }
        }

        function checkDeel(key) {
          const perkDiv = $(`div:icontains('${key}'):not(:has(div))`, el);
          if (perkDiv.length > 0) {
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

        // 3. check delivery time
        const shouldHideDelivery = () => {
          const div = $(`div:icontains('min'):not(:has(div))`, el);
          const text = div.text().replace("min", "").trim();
          if (!text) {
            return false;
          }
          const timing = text.split("–");
          return (
            parseFloat(timing[timing.length - 1]) >
            parseFloat(storedData.deliveryTimeMax)
          );
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

      // if (self === top) {
      // const popover = jQuery(`<div
      // id="card-preview"
      // class="uk-card uk-card-body uk-card-default uk-drop"
      // uk-drop="pos: bottom-center"
      // >
      // <iframe style="width:100%; height:100%"/>
      // </div>`);
      // $(el).append(popover);

      // const iframe = $("iframe", popover);
      // UIkit.util.on("#card-preview", "beforeshow", () => {
      // if (!iframe.attr("src")) {
      // iframe.attr("src", $("a", el).attr("href"));
      // }
      // });
      // }
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
      const mainContent = $("main#main-content");
      const mainFeed = document.createElement("div");
      mainContent.prepend(mainFeed);

      const card = jQuery(`
        <div class="uk-width-1-2@m uk-card">
          <div id="card-header" class="uk-card-header uk-flex uk-flex-between">
            <h3 class="uk-card-title">Better Eats</h3>
            <button id="header-close" type="button" uk-close></button>
          </div>
          <div id="card-body" class="uk-card-body uk-padding-remove-top uk-padding-remove-bottom"></div>
          <div id="card-footer" class="uk-card-footer uk-flex uk-flex-between"></div>
        </div>
      `);
      card.attr(
        "style",
        "bottom: 0; height: auto; width: 400px; background-color: palegoldenrod; z-index: 50;"
      );
      card.attr("class", "uk-position-fixed uk-flex-column");
      $("body").append(card);

      // cardBody
      const cardBody = $("#card-body");

      function close(event) {
        cardBody.hide();
        $("#header-close").attr("style", "display: none");
        $("#card-footer").attr("style", "display: none !important");
        event.stopPropagation();
      }
      $("#header-close").on("click", close);

      function show() {
        cardBody.show();
        $("#header-close").attr("style", "display: ''");
        $("#card-footer").attr("style", "display: ''");
      }
      $("#card-header").on("click", show);

      function appendTypesFilter() {
        const typesFilter = jQuery(`
        <div class="uk-flex-column">
        </div>
        `);
        cardBody.append(typesFilter);

        const bogoFilter = jQuery(`
        <div class="flex items-center space-x-2">
          <input
            class="uk-toggle-switch uk-toggle-switch-primary"
            id="bogoFilter"
            type="checkbox"
          />
            <label class="uk-form-label" for="toggle-switch">Buy 1, Get 1</label>
        </div>
        `);
        typesFilter.append(bogoFilter);
        $("#bogoFilter").attr("checked", storedData.bogoOnly);

        bogoFilter.on("click", function () {
          storedData.bogoOnly = !storedData.bogoOnly;
          window.localStorage.setItem("ubereats", JSON.stringify(storedData));
          $("> div", mainFeed).each(function () {
            autoFilterItems($(this));
          });
        });

        const sp10Filter = jQuery(`
        <div class="flex items-center space-x-2 mt-3">
          <input
            class="uk-toggle-switch uk-toggle-switch-primary"
            id="sp10"
            type="checkbox"
          />
            <label class="uk-form-label" for="toggle-switch">Spend $10, Get $8</label>
        </div>
        `);
        typesFilter.append(sp10Filter);
        $("#sp10").attr("checked", storedData.spend10Get8);

        sp10Filter.on("click", function () {
          storedData.spend10Get8 = !storedData.spend10Get8;
          window.localStorage.setItem("ubereats", JSON.stringify(storedData));
          $("> div", mainFeed).each(function () {
            autoFilterItems($(this));
          });
        });

        const hasOffersFilter = jQuery(`
        <div class="flex items-center space-x-2 mt-3">
          <input
            class="uk-toggle-switch uk-toggle-switch-primary"
            id="hasOffers"
            type="checkbox"
          />
            <label class="uk-form-label" for="toggle-switch">Has Offers Available</label>
        </div>
        `);
        typesFilter.append(hasOffersFilter);
        $("#hasOffers").attr("checked", storedData.hasOffers);

        hasOffersFilter.on("click", function () {
          storedData.hasOffers = !storedData.hasOffers;
          window.localStorage.setItem("ubereats", JSON.stringify(storedData));
          $("> div", mainFeed).each(function () {
            autoFilterItems($(this));
          });
        });
      }
      appendTypesFilter();

      function appendDeliveryTimeFilter() {
        const filter = jQuery(`
          <div class="uk-margin">
            <label class="uk-form-label" for="form-stacked-text">Max delivery time (min.)</label>
            <div class="uk-form-controls uk-background-default">
              <input id="deliveryTimeMax" type="number" class="uk-input" />
            </div>
          </div>
        `);
        cardBody.append(filter);

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
        const filter = jQuery(`
          <div class="uk-margin">
            <label class="uk-form-label" for="form-stacked-text">Black list</label>
            <div class="uk-form-controls uk-background-default">
              <textarea id="excludeList" class="uk-textarea uk-height-medium"></textarea>
            </div>
            <div class="uk-form-help">
              Hide restaurants you do not want to see, one per line, ie. 'bubble tea', 'mcdonald'
            </div>
          </div>
        `);
        cardBody.append(filter);

        jQuery("#excludeList").val(storedData.excludeList.join("\n"));
        jQuery("#excludeList").on("blur", function () {
          storedData.excludeList = $(this).val().split("\n");
          window.localStorage.setItem("ubereats", JSON.stringify(storedData));
          $("> div", mainFeed).each(function () {
            autoFilterItems($(this));
          });
        });
      }
      appendExclusionFilter();

      function appendApplyButton() {
        const button = jQuery(`
          <button id="close" class="uk-button uk-button-default">Close</button>
          <button id="reload" class="uk-button uk-button-primary">Apply</button>
        `);
        $("#card-footer").append(button);

        jQuery("#reload").click(function () {
          location.reload();
        });

        jQuery("#close").click(close);
      }
      appendApplyButton();
    }, 2500);

    $("main").arrive(
      "div[data-test='feed-desktop']",
      { onlyOnce: true },
      function () {
        // 'this' refers to the newly created element
        var mainFeed = $(this);

        // update the grid to 5 per row
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
      // this is the popover preview
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
