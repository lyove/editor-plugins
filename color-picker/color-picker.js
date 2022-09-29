(function () {
  /**
   * Util
   */
  const util = {
    css: function (elem, obj) {
      for (let i in obj) {
        elem.style[i] = obj[i];
      }
    },
    hasClass: function (elem, className) {
      const classNames = elem.getAttribute("class");
      return classNames.indexOf(className) != -1;
    },
  };

  /**
   * constructor
   * @param {*} options
   */
  function ColorPicker(options) {
    if (this === window) {
      throw `ColorPicker: Can't call a function directly`;
    }
    if (!(options instanceof Object)) {
      throw new Error("Error options");
    }
    this.init(options);
  }

  /**
   * prototype
   */
  ColorPicker.prototype = {
    default: {
      initColor: "rgb(255,255,255)",
      allMode: ["hex", "rgb"],
      color: "#fff",
    },

    init(options) {
      let {
        element,
        initColor = this.default.initColor,
        allMode = this.default.allMode,
        color = this.default.color,
      } = options;

      let bindElem = element instanceof HTMLElement ? element : document.getElementById(String(element));

      if (!(bindElem && bindElem.nodeType && bindElem.nodeType === 1)) {
        throw `ColorPicker: not found  ID:${el}  HTMLElement,not ${{}.toString.call(el)}`;
      }

      this.Options = {
        ...options,
        element,
        initColor,
        allMode,
        color,
      };

      this.bindElem = bindElem;
      this.elem_wrap = null;
      this.fixedBg = null;
      this.elem_colorPancel = null;
      this.elem_picker = null;
      this.elem_barPicker1 = null;
      this.elem_colorInput = null;
      this.elem_showColor = null;
      this.elem_changeModeBtn = null;
      this.elem_inputWrap = null;
      this.pancelLeft = 0;
      this.pancelTop = 0;
      this.downX = 0;
      this.downY = 0;
      this.moveX = 0;
      this.moveY = 0;
      this.pointLeft = 0;
      this.pointTop = 0;
      this.current_mode = "hex";
      this.rgba = { r: 0, g: 0, b: 0, a: 1 };
      this.hsb = { h: 0, s: 100, b: 100 };

      // Init color
      const initRgb = initColor.slice(4, -1).split(",");
      this.rgba.r = parseInt(initRgb[0]);
      this.rgba.g = parseInt(initRgb[1]);
      this.rgba.b = parseInt(initRgb[2]);

      const _this = this;

      // Create color-picker dom
      const color_picker_wrap = document.createElement("div");
      color_picker_wrap.className = "color-picker-modal";
      color_picker_wrap.innerHTML = this.render();
      document.body.appendChild(color_picker_wrap);

      this.elem_wrap = color_picker_wrap;
      this.fixedBg = this.elem_wrap.children[0];
      this.elem_colorPancel = this.elem_wrap.getElementsByClassName("color-pancel")[0];
      this.pancel_width = this.elem_colorPancel.offsetWidth;
      this.pancel_height = this.elem_colorPancel.offsetHeight;
      this.elem_picker = this.elem_wrap.getElementsByClassName("pickerBtn")[0];
      this.elem_colorPalette = this.elem_wrap.getElementsByClassName("color-picker_palette")[0];
      this.elem_showColor = this.elem_wrap.getElementsByClassName("color-picker-showColor")[0];
      this.elem_barPicker1 = this.elem_wrap.getElementsByClassName("colorBar-color-picker")[0];
      // this.elem_barPicker2 = this.elem_wrap.getElementsByClassName("colorBar-opacity-picker")[0];
      this.elem_colorInput = this.elem_wrap.getElementsByClassName("color-picker-colorInput")[0];
      this.elem_changeModeBtn = this.elem_wrap.getElementsByClassName("color-picker-changeModeBtn")[0];
      this.elem_inputWrap = this.elem_wrap.getElementsByClassName("color-picker-inputWrap")[0];
      // this.elem_opacityPancel = this.elem_barPicker2.parentNode.parentNode.children[1];

      // let rect = this.bindElem.getBoundingClientRect();
      let wrap_top = bindElem.offsetTop;
      let wrap_left = bindElem.offsetLeft;
      while (bindElem.offsetParent) {
        wrap_top += bindElem.offsetParent.offsetTop;
        wrap_left += bindElem.offsetParent.offsetLeft;
        bindElem = bindElem.offsetParent;
      }
      this.pancelLeft = wrap_left + this.elem_colorPalette.clientWidth;
      this.pancelTop = wrap_top + this.bindElem.offsetHeight;
      util.css(this.elem_wrap, {
        left: wrap_left + "px",
        top: wrap_top + this.bindElem.offsetHeight + "px",
        display: "none",
      });

      // Events
      this.bindMove(this.elem_colorPancel, this.setPosition, true);
      this.bindMove(this.elem_barPicker1.parentNode, this.setBar, false);
      /*  this.bindMove(this.elem_barPicker2.parentNode,this.setBar,false); */
      this.bindElem.addEventListener(
        "click",
        function () {
          _this.show();
        },
        false
      );
      this.fixedBg.addEventListener(
        "click",
        function (e) {
          _this.hide();
        },
        false
      );
      this.elem_changeModeBtn.addEventListener(
        "click",
        function () {
          _this.switch_current_mode();
        },
        false
      );
      this.elem_wrap.addEventListener(
        "input",
        function (e) {
          _this.setColorByInput(e.target.value);
        },
        false
      );
      this.elem_colorPalette.addEventListener(
        "click",
        function (e) {
          if (e.target.className === "palette-item") {
            let colorStr = e.target.style.background;
            let rgb = colorStr.slice(4, -1).split(",");
            let rgba = {
              r: parseInt(rgb[0]),
              g: parseInt(rgb[1]),
              b: parseInt(rgb[2]),
            };
            const inputs = _this.elem_wrap.getElementsByClassName("color-picker-colorInput");
            switch (_this.current_mode) {
              case "hex":
                const hexValue = `#${_this.rgbToHex(rgba)}`;
                _this.setColorByInput(hexValue);
                inputs[0].value = hexValue;
                break;
              case "rgb":
                inputs[0].value = rgba.r;
                inputs[1].value = rgba.g;
                inputs[2].value = rgba.b;
                _this.setColorByInput(colorStr);
                /*  _this.hsb = _this.rgbToHsb(rgba); */
                break;
              default:
            }
          }
        },
        false
      );
      color !== "" && this.setColorByInput(color);
    },

    render: function () {
      const tpl = `<div class="fixed-bg"></div>
        <div class="color-picker-box">
          <div class='color-picker_palette'>
            ${this.getPaletteColorsItem()}
          </div>
          <div class="color-picker-pancel">
            <div class="pancel_">
              <div class="color-pancel" style="background: rgb(${this.rgba.r},${this.rgba.g},${this.rgba.b})">
                <div class="saturation-white">
                  <div class="saturation-black">
                  </div>
                  <div class="pickerBtn">
                    <div class="pickerBtn-inner"></div>
                  </div>
                </div>
              </div>
            </div>
            <div class="hue_">
              <div class="flexbox-fix flex-center">
                <div class="hue-dot">
                  <div class="color-picker-showColor" style="background:rgb(${this.rgba.r},${this.rgba.g},${this.rgba.b})"></div>
                </div>
                <div class="hue-horizontal">
                  <div class="colorBar-color-picker"></div>
                </div>
              </div>
            </div>
            <div class="hex_">
              <div class="flexbox-fix">
              <div class="color-picker-inputWrap flexbox-fix">
                ${this.getInputTpl()}
              </div>
              <div class="color-picker-changeModeBtn">
                <svg class="change-icon" width="24" height="24" viewBox="0 0 24 24">
                  <path fill="#333" d="M12,5.83L15.17,9L16.58,7.59L12,3L7.41,7.59L8.83,9L12,5.83Z"></path>
                  <path fill="#333" d="M12,18.17L8.83,15L7.42,16.41L12,21L16.59,16.41L15.17,15Z"></path>
                </svg>
              </div>
            </div>
            </div>
          </div>
        </div>
      </div>`;
      return tpl;
    },

    getInputTpl: function () {
      let current_mode_html = "";
      switch (this.current_mode) {
        case "hex":
          const hexValue = "#" + this.rgbToHex(this.HSBToRGB(this.hsb));
          current_mode_html += `
            <div class="hexInputWrap">
              <input class="color-picker-colorInput" value="${hexValue}" spellcheck="false">
              <span class="mode-text">hex</span>
            </div>`;
          break;
        case "rgb":
          const RGB_str = 'rgb';
          for (let i = 0; i < RGB_str.length; i++) {
            current_mode_html += `
              <div class="rgbInputWrap">
                <input class="color-picker-colorInput" value="${this.rgba["rgb"[i]]}" spellcheck="false">
                <span class="mode-text">${RGB_str[i]}</span>
              </div>
            `;
          }
        default:
      }
      return current_mode_html;
    },

    getPaletteColorsItem: function () {
      let str = "";
      let palette = [
        "rgb(0, 0, 0)",
        "rgb(67, 67, 67)",
        "rgb(102, 102, 102)",
        "rgb(204, 204, 204)",
        "rgb(217, 217, 217)",
        "rgb(255, 255, 255)",
        "rgb(152, 0, 0)",
        "rgb(255, 0, 0)",
        "rgb(255, 153, 0)",
        "rgb(255, 255, 0)",
        "rgb(0, 255, 0)",
        "rgb(0, 255, 255)",
        "rgb(74, 134, 232)",
        "rgb(0, 0, 255)",
        "rgb(153, 0, 255)",
        "rgb(255, 0, 255)",
        "rgb(230, 184, 175)",
        "rgb(244, 204, 204)",
        "rgb(252, 229, 205)",
        "rgb(255, 242, 204)",
        "rgb(217, 234, 211)",
        "rgb(208, 224, 227)",
        "rgb(201, 218, 248)",
        "rgb(207, 226, 243)",
        "rgb(217, 210, 233)",
        "rgb(234, 209, 220)",
        "rgb(221, 126, 107)",
        "rgb(234, 153, 153)",
        "rgb(249, 203, 156)",
        "rgb(255, 229, 153)",
        "rgb(182, 215, 168)",
        "rgb(162, 196, 201)",
        "rgb(164, 194, 244)",
        "rgb(159, 197, 232)",
        "rgb(180, 167, 214)",
      ];
      palette.forEach((item) => (str += `<span class="palette-item" style='background:${item};'></span>`));
      return str;
    },

    setPosition(x, y) {
      let pLeft = parseInt(x - this.pancelLeft);
      let pTop = parseInt(y - this.pancelTop);
      this.pointLeft = Math.max(0, Math.min(pLeft, this.pancel_width));
      this.pointTop = Math.max(0, Math.min(pTop, this.pancel_height));
      util.css(this.elem_picker, {
        left: this.pointLeft + "px",
        top: this.pointTop + "px",
      });
      this.hsb.s = parseInt((100 * this.pointLeft) / this.pancel_width);
      this.hsb.b = parseInt((100 * (this.pancel_height - this.pointTop)) / this.pancel_height);
      this.setShowColor();
      this.setValue(this.rgba);
    },

    setBar: function (elem, x) {
      let elem_bar = elem.children[0];
      let rect = elem.getBoundingClientRect();
      let elem_width = elem.offsetWidth;
      let X = Math.max(0, Math.min(x - rect.x, elem_width));
      if (elem_bar === this.elem_barPicker1) {
        util.css(elem_bar, {
          left: X + "px",
        });
        this.hsb.h = parseInt((360 * X) / elem_width);
      } else {
        util.css(elem_bar, {
          left: X + "px",
        });
        this.rgba.a = X / elem_width;
      }
      this.setPancelColor(this.hsb.h);
      this.setShowColor();
      this.setValue(this.rgba);
    },

    setPancelColor: function (h) {
      const rgb = this.HSBToRGB({ h: h, s: 100, b: 100 });
      util.css(this.elem_colorPancel, {
        background: "rgba(" + rgb.r + "," + rgb.g + "," + rgb.b + "," + this.rgba.a + ")",
      });
    },

    setShowColor: function () {
      const rgb = this.HSBToRGB(this.hsb);
      this.rgba.r = rgb.r;
      this.rgba.g = rgb.g;
      this.rgba.b = rgb.b;
      util.css(this.elem_showColor, {
        background: "rgba(" + rgb.r + "," + rgb.g + "," + rgb.b + "," + this.rgba.a + ")",
      });
    },

    setValue: function (rgb) {
      const hex = "#" + this.rgbToHex(rgb);
      this.elem_inputWrap.innerHTML = this.getInputTpl();
      this.Options?.change(this.bindElem, hex);
    },

    setColorByInput: function (value) {
      switch (this.current_mode) {
        case "hex":
          value = value.slice(1);
          if (value.length === 3) {
            value = "#" + value[0] + value[0] + value[1] + value[1] + value[2] + value[2];
            this.hsb = this.hexToHsb(value);
          } else if (value.length == 6) {
            this.hsb = this.hexToHsb(value);
          }
          break;
        case "rgb":
          const inputs = this.elem_wrap.getElementsByClassName("color-picker-colorInput"),
            rgb = {
              r: inputs[0].value ? parseInt(inputs[0].value) : 0,
              g: inputs[1].value ? parseInt(inputs[1].value) : 0,
              b: inputs[2].value ? parseInt(inputs[2].value) : 0,
            };
          this.hsb = this.rgbToHsb(rgb);
      }
      this.changeViewByHsb();
    },

    changeViewByHsb: function () {
      this.pointLeft = parseInt((this.hsb.s * this.pancel_width) / 100);
      this.pointTop = parseInt(((100 - this.hsb.b) * this.pancel_height) / 100);
      util.css(this.elem_picker, {
        left: this.pointLeft + "px",
        top: this.pointTop + "px",
      });
      this.setPancelColor(this.hsb.h);
      this.setShowColor();
      util.css(this.elem_barPicker1, {
        left: (this.hsb.h / 360) * this.elem_barPicker1.parentNode.offsetWidth + "px",
      });
      const hex = "#" + this.rgbToHex(this.HSBToRGB(this.hsb));
      this.Options.change(this.bindElem, hex);
    },

    switch_current_mode: function () {
      this.current_mode = this.current_mode == "hex" ? "rgb" : "hex";
      this.elem_inputWrap.innerHTML = this.getInputTpl();
    },

    bindMove: function (elem, fn, bool) {
      const _this = this;
      elem.addEventListener(
        "mousedown",
        function (e) {
          _this.downX = e.pageX;
          _this.downY = e.pageY;
          if (bool) {
            fn.call(_this, _this.downX, _this.downY);
          } else {
            fn.call(_this, elem, _this.downX, _this.downY);
          }
          document.addEventListener("mousemove", mousemove, false);
          function mousemove(e) {
            _this.moveX = e.pageX;
            _this.moveY = e.pageY;
            if (bool) {
              fn.call(_this, _this.moveX, _this.moveY);
            } else {
              fn.call(_this, elem, _this.moveX, _this.moveY);
            }
            e.preventDefault();
          }
          document.addEventListener("mouseup", mouseup, false);
          function mouseup(e) {
            document.removeEventListener("mousemove", mousemove, false);
            document.removeEventListener("mouseup", mouseup, false);
          }
        },
        false
      );
    },

    show: function () {
      util.css(this.elem_wrap, {
        display: "block",
      });
    },

    hide: function () {
      util.css(this.elem_wrap, {
        display: "none",
      });
    },

    HSBToRGB: function (hsb) {
      let rgb = {};
      let h = Math.round(hsb.h);
      let s = Math.round((hsb.s * 255) / 100);
      let v = Math.round((hsb.b * 255) / 100);
      if (s === 0) {
        rgb.r = rgb.g = rgb.b = v;
      } else {
        let t1 = v;

        let t2 = ((255 - s) * v) / 255;
        let t3 = ((t1 - t2) * (h % 60)) / 60;
        if (h == 360) h = 0;
        if (h < 60) {
          rgb.r = t1;
          rgb.b = t2;
          rgb.g = t2 + t3;
        } else if (h < 120) {
          rgb.g = t1;
          rgb.b = t2;
          rgb.r = t1 - t3;
        } else if (h < 180) {
          rgb.g = t1;
          rgb.r = t2;
          rgb.b = t2 + t3;
        } else if (h < 240) {
          rgb.b = t1;
          rgb.r = t2;
          rgb.g = t1 - t3;
        } else if (h < 300) {
          rgb.b = t1;
          rgb.g = t2;
          rgb.r = t2 + t3;
        } else if (h < 360) {
          rgb.r = t1;
          rgb.g = t2;
          rgb.b = t1 - t3;
        } else {
          rgb.r = 0;
          rgb.g = 0;
          rgb.b = 0;
        }
      }
      return { r: Math.round(rgb.r), g: Math.round(rgb.g), b: Math.round(rgb.b) };
    },

    rgbToHex: function (rgb) {
      const arr = [rgb.r.toString(16), rgb.g.toString(16), rgb.b.toString(16)];
      const hex = arr.map((item) => (item.length === 1 ? `0${item}` : item));
      return hex.join("");
    },

    hexToRgb: function (hex) {
      const $hex = parseInt(hex.indexOf("#") > -1 ? hex.substring(1) : hex, 16);
      return {
        r: $hex >> 16,
        g: ($hex & 0x00ff00) >> 8,
        b: $hex & 0x0000ff,
      };
    },

    hexToHsb: function (hex) {
      return this.rgbToHsb(this.hexToRgb(hex));
    },

    rgbToHsb: function (rgb) {
      let hsb = { h: 0, s: 0, b: 0 };
      let min = Math.min(rgb.r, rgb.g, rgb.b);
      let max = Math.max(rgb.r, rgb.g, rgb.b);
      let delta = max - min;
      hsb.b = max;
      hsb.s = max != 0 ? (255 * delta) / max : 0;
      if (hsb.s !== 0) {
        if (rgb.r == max) {
          hsb.h = (rgb.g - rgb.b) / delta;
        } else if (rgb.g == max) {
          hsb.h = 2 + (rgb.b - rgb.r) / delta;
        } else {
          hsb.h = 4 + (rgb.r - rgb.g) / delta;
        }
      } else {
        hsb.h = -1;
      }
      hsb.h *= 60;
      if (hsb.h < 0) {
        hsb.h += 360;
      }
      hsb.s *= 100 / 255;
      hsb.b *= 100 / 255;
      return hsb;
    },
  };

  ColorPicker.create = function (options) {
    return new ColorPicker(options);
  };

  window.ColorPicker = ColorPicker;
})();
