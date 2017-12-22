/*------------------------------------------------------------------------------*
 *  The MIT License (MIT)
 * 
 *  Copyright (c) 2016 Jeff Christy
 * 
 *  Permission is hereby granted, free of charge, to any person obtaining a 
 *  copy of this software and associated documentation files (the "Software"), 
 *  to deal in the Software without restriction, including without limitation 
 *  the rights to use, copy, modify, merge, publish, distribute, sublicense, 
 *  and/or sell copies of the Software, and to permit persons to whom the 
 *  Software is furnished to do so, subject to the following conditions:
 * 
 *  The above copyright notice and this permission notice shall be included in
 *  all copies or substantial portions of the Software.
 * 
 *  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING 
 *  FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER 
 *  DEALINGS IN THE SOFTWARE.
 *------------------------------------------------------------------------------*/

/**
 * Form Binder 
 * 
 * Created by Jeff Christy
 * 
 */ 
(function ($) {

  /**
   * Class object that will be returned 
   * 
   * @param {type} $this
   * @param {type} oModel
   * @returns {form_binderL#7.FormBinder}
   */
  function FormBinder($this, oModel) {
    //todo, if we don't have an id, make one!
    var sFormId = $this.attr("id");

    var oBinder = new Binder(sFormId);
    
    var oFormBinder = {
      oElement: $this,

      // our data oModel
      oModel: oModel,
      
      // our data oModel
      bModelUpdateEvent: true,

      // the calcs object stores an index of all  properties with 
      // an array of calc fields that reference it
      calcs: {},

      /**
       * Getter for stored data elements of the FormBinder
       * @param {string} sProperty
       * @returns {FormBinder.oFormBinder.}
       */
      get: function(sProperty) {
        if (sProperty[0] === "_") {
          this.getCalc(sProperty);
        }
        else {
          return this.oModel[sProperty];
        }
      },

      /**
       * Setter for storing data elements in the FormBinder Store
       * 
       * @param {string} sProperty
       * @param {string} sVal
       * @returns {FormBinder.oFormBinder}
       */
      set: function(sProperty, sVal) {
        if (sProperty[0] === "_") {
          return this.setCalc(sProperty, sVal);
        }

        // save the property/value in the 
        this.oModel[sProperty] = sVal;

        // we just changed a property within the oModel, so we need to 
        // trigger the Binder to update all subscribed elements
        oBinder.trigger(sFormId + ":change", [sProperty, sVal, true]);

        // see if calc properties exist that are referencing this property
        if (this.calcs[sProperty] !== undefined && Object.prototype.toString.call(this.calcs[sProperty]) === '[object Array]') {
          // we have calc properties
          var aCalcProperties = this.calcs[sProperty];

          // this property is included in some calculations so, trigger 
          // events for these as well
          for (var i in aCalcProperties) {
            var sCalcVal = this.getCalc(aCalcProperties[i]);
            oBinder.trigger(sFormId + ":change", [aCalcProperties[i], sCalcVal, true]);
          }
        }

        /*--------------------------------------------------------------------------*
         * Now check the flag to see if we should fire an event indicating that the
         * model has been updated
         *--------------------------------------------------------------------------*/
        if (this.bModelUpdateEvent) {
          oBinder.trigger(sFormId + ":updated");
        }
        
        return oFormBinder;
      },

      /**
       * Special setter to set a calculated property. A calculated property 
       * is just a property prefixed with _ symbol that contains other 
       * model properties concatenated together with fixed text
       * 
       * calc("cFullName", "Mr/Mrs/Ms {sFirstName} {sLastName}");
       * 
       * @param {string} sProperty
       * @param {string} sCalcString
       * @returns {FormBinder.oFormBinder}
       */
      setCalc: function(sProperty, sCalcString) {
        this.oModel[sProperty] = sCalcString;
        var aProperties = extractProperties(sCalcString);

        // now we just updated a calculation so we need to update all 
        // properties that are referenced in this in calcs 
        for (var i = 0; i < aProperties.length; i++) {
          if (this.calcs[aProperties[i]] === undefined || Object.prototype.toString.call(this.calcs[aProperties[i]]) !== '[object Array]') {
            this.calcs[aProperties[i]] = [];
          }
          this.calcs[aProperties[i]].push(sProperty);
        }

        // let's create our value so we can update the DOM
        var sVal = interpolateProperties(sCalcString);

        // we just changed a calc property within the oModel, so we need to 
        // trigger the Binder to update all subscribed elements
        oBinder.trigger(sFormId + ":change", [sProperty, sVal, true]);
        return oFormBinder;
      },

      /**
       * Special getter to get a calculated property. A calculated property 
       * is just a property prefixed with _ symbol that contains other 
       * model properties concatenated together with fixed text. 
       * 
       * Properties names are inserted into a text string enclosedin {}
       * 
       * setCalc("_FullName", "Mr/Mrs/Ms {sFirstName} {sLastName}");
       * 
       * @param {string} sProperty
       * @returns {FormBinder.oFormBinder.oModel}
       */
      getCalc: function(sProperty) {
        var sString = this.oModel[sProperty];
        return interpolateProperties(sString);
      },

      /**
       * 
       * @param {type} sProperty
       * @returns {type}
       */
      getProperty: function(sProperty) {
        console.log("getProperty: " + sProperty + " => " + this.oModel[sProperty]);
        return this.oModel[sProperty];
      },

      /**
       * setter for properties within the model object
       * 
       * @param {type} sProperty
       * @param {type} sValue
       * @returns {undefined}
       */
      setProperty: function (sProperty, sValue) {
        this.oModel[sProperty] = sValue;
        console.log("setProperty: " + sProperty + " => " + sValue);
        return this;
      },

      /**
       * 
       * @returns {form_binderL#7.FormBinder.oFormBinder.model}
       */
      getModel: function() {
        console.log("getModel: " + JSON.stringify(this.oModel));
        return this.oModel;
      },

      /**
       * setter for properties within the model object
       * 
       * @returns {undefined}
       */
      setModel: function (oModel) {
        this.oModel = oModel;
        console.log("setModel: " + JSON.stringify(oModel));
        return this;
      },

      /**
       * setter for properties within the model object
       * 
       * @returns {void}
       */
      setUpdateCallback: function (sCallback) {
        oBinder.on(sFormId + ":updated", function(oEvent) {
          sCallback(oEvent);
        });
      },

      binder: oBinder
    };

    // Now subscribe to the Binder class with an event handler so we can 
    // update the ViewModel with data that has changed data from the DOM
    oBinder.on(sFormId + ":change", function(oEvent, sAttrName, sNewVal, bDontSet) {
      // Note that only the ViewModel setter will create an event that will 
      // pass true for bDontSet. An event from the Binder won't have this 
      // argument, so if bDontSet is true, we will not call the ViewModel's 
      // setter. In this case, we will ignore the event
      bDontSet = bDontSet || false;
      if (!bDontSet) {
        oFormBinder.set(sAttrName, sNewVal);
      }
    });

    
    /**
     * Load the model data 
     * 
     * @param {type} $this
     * @param {type} oModel
     * @returns {bool}
     */
    function processModel($this, oModel, oFormBinder) {
      // turn off model update event
      oFormBinder.bModelUpdateEvent = false;
      
      // Make sure its a valid model object
      if (typeof oModel !== "object" || Array.isArray(oModel)) {
        // not an object, we can't use this
        console.log("formBinder - invalid object model provided");
        return false;
      }

      // each model property should be an element in the form, let's find it
      for (var sElement in oModel) {
        if ($('input[name="' + sElement + '"]', $this).length) {
          // form element found with name attribute
          var $oElement = $('input[name="' + sElement + '"]', $this);
        }
        else if ($('textarea[name="' + sElement + '"]', $this).length) {
          // form element found in text area using name attribute
          $oElement = $('textarea[name="' + sElement + '"]', $this);
        }
        else if ($('#' + sElement, $this).length) {
          // form element found using id attribute
          $oElement = $('#' + sElement, $this);
        }
        else {
          // form element not found
          console.log("formBinder - model form/element does not exist, skipping: " + sElement);
          continue;
        }

        // we have found our form element, now add a data-bind attribute to it so we can link it
        $oElement.attr("data-form-binder-" + $this.attr('id'), sElement);
        oFormBinder.set(sElement, oModel[sElement]);
//        $oElement.val(oModel[sElement]);
      }

      // turn on model update event as we're all done
      oFormBinder.bModelUpdateEvent = true;
      
      return true;
    };


    /**
     * The Binder class
     * 
     * The Binder provides the ability to link properties within a ViewModel 
     * object to DOM elements. The Binder is responsible for managing events 
     * in order to keep ViewModel properties continuously in sync with all 
     * DOM elements that have subscribed to a ViewModel property
     * 
     * The process of linking a ViewModel and a DOM element via the Binder is
     * by using a unique Sub Id text string. Throughout the ViewModel and 
     * Binder code this string is identified by the variable name sFormId. 
     * 
     * Each ViewModel is instantiated using a sFormId string. The ViewModel 
     * will then trigger an event for the Binder to establish the DOM event
     * handler to capture any events for this sFormId.
     * 
     * So that as soon as a ViewModel property's vlaue is changed, either in 
     * JavaScript, by calling the ViewModel's setter or within the DOM by an 
     * input element changing a subscribed value.
     * 
     * @param {string} sFormId
     * @returns {_jQuery|jQuery|Binder.$oBridge}
     */
    function Binder(sFormId) {
      // Create a jQuery object to bridge the Binder with DOM services
      // This will allow us to easily select all subscribed DOM elements
      // to Trigger and Handle events
      var $oBridge = jQuery({});

      // We will use the html `data` attribute for linking our bindings
      // as: data-bind-{sFormId}="{Property}"
      var sDataAttr = "form-binder-" + sFormId;

      // Here we will create an event name that will be used for triggering
      // the handler within our ViewModel
      var sEventName = sFormId + ":change";

      // Create an event handler for all data-bind-{sFormId} dom elements 
      // This is for input type DOM elements that have the capability to modify 
      // ViewModel data
      jQuery(document).on("change", "[data-" + sDataAttr + "]", function(oEvent) {
        // Convert this DOM element to jQuery
        var $oInput = jQuery(this);

        // Since the DOM element has just updated our ViewModel data, we need 
        // to trigger an event to tell the ViewModel to update its store value
        $oBridge.trigger(sEventName, [ $oInput.data( sDataAttr ), $oInput.val()]);
      });

      // Here we use our jQuery Bridge object to create our event handler
      // for this sFormId; specifically for events fired from our ViewModel
      $oBridge.on(sEventName, function(oEvent, sPropName, sNewVal) {
        // An event was just fired from our ViewModel providing us with
        // the property name and its new value. We need to find all DOM
        // elements subscribing to this ViewModel property and update them 
        // with the new value
        jQuery("[data-" + sDataAttr + "=" + sPropName + "]").each(function() {
          // this is a subscribed DOM object, let's convert it to jQuery
          var $oBound = jQuery(this);

          // now update the value within the DOM for the proper element type
          if ($oBound.is("input[type='radio']")) {
            $("input[name=" + $oBound.prop("name") + "][value=" + sNewVal + "]").prop('checked', true);
          }
          else if ($oBound.is("input[type='checkbox']")) {
            if (sNewVal == $oBound.prop('value')) {
              $oBound.prop('checked', true);  
            }
            else {
              $oBound.prop('checked', false);
            }
          }
          else if ($oBound.is("input, textarea, select")) {
            $oBound.val(sNewVal);
          }
          else {
            $oBound.text(sNewVal);
          }
        });
      });

      // return the oBridge object so that all ViewModels will have DOM 
      // services for triggering and handling events to/from this Binder class
      return $oBridge;
    }

    var bReturn = processModel($this, oModel, oFormBinder);
    if (!bReturn) {
      return false;
    }

    bModelImport = false;
    
    return oFormBinder;
  }

  /**
   * Extend jQuery with formBinder
   * 
   * @param {type} oModel
   * @returns {form_binderL#7.FormBinder.oFormBinder|form_binderL#7.FormBinder}
   */
  $.fn.formBinder = function (oModel) {
    return new FormBinder(this, oModel);
  };

})(jQuery);
