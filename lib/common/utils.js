var numeral = require ("numeral");

let id_regex = /\b\d+\.\d+\.(\d+)\b/;

import {ChainTypes} from "gxbjs/es";

var {object_type, operations} = ChainTypes;

var Utils = {
    get_object_id: (obj_id) => {
        let id_regex_res = id_regex.exec (obj_id);
        return id_regex_res ? Number.parseInt (id_regex_res[1]) : 0;
    },

    is_object_id: (obj_id) => {
        if ('string' != typeof obj_id) return false;
        let match = id_regex.exec (obj_id);
        return (match !== null && obj_id.split (".").length === 3);
    },

    is_object_type: (obj_id, type) => {
        let prefix = object_type[type];
        if (!prefix || !obj_id) return null;
        prefix = "1." + prefix.toString ();
        return obj_id.substring (0, prefix.length) === prefix;
    },

    accMult : (arg1, arg2) => {
        let m = 0;
        let s1 = arg1.toString();
        let s2 = arg2.toString();
        try {
            m += s1.split('.')[1].length;
        } catch (e) {
        }
        try {
            m += s2.split('.')[1].length;
        } catch (e) {
        }
        return Number(s1.replace('.', '')) * Number(s2.replace('.', '')) / Math.pow(10, m);
    },

    get_satoshi_amount (amount, asset) {
        let precision = asset.toJS ? asset.get ("precision") : asset.precision;
        let assetPrecision = this.get_asset_precision (precision);
        amount = typeof amount === "string" ? amount : amount.toString ();

        let decimalPosition = amount.indexOf (".");
        if (decimalPosition === -1) {
            return parseInt (amount, 10) * assetPrecision;
        } else {
            let amountLength = amount.length,
                i;
            amount = amount.replace (".", "");
            amount = amount.substr (0, decimalPosition + precision);
            for (i = 0; i < precision; i++) {
                decimalPosition += 1;
                if (decimalPosition > amount.length) {
                    amount += "0";
                }
            }
            ;

            return parseInt (amount, 10);
        }
    },

    get_asset_precision: (precision) => {
        precision = precision.toJS ? precision.get ("precision") : precision;
        return Math.pow (10, precision);
    },

    get_asset_amount: function (amount, asset) {
        if (amount === 0) return amount;
        if (!amount) return null;
        return amount / this.get_asset_precision (asset.toJS ? asset.get ("precision") : asset.precision);
    },

    get_asset_price: function (quoteAmount, quoteAsset, baseAmount, baseAsset, inverted = false) {
        if (!quoteAsset || !baseAsset) {
            return 1;
        }
        var price = this.get_asset_amount (quoteAmount, quoteAsset) / this.get_asset_amount (baseAmount, baseAsset);
        return inverted ? 1 / price : price;
    },

    round_number: function (number, asset) {
        let assetPrecision = asset.toJS ? asset.get ("precision") : asset.precision;
        let precision = this.get_asset_precision (assetPrecision);
        return Math.round (number * precision) / precision;
    },

    format_volume (amount) {

        if (amount < 10000) {
            return this.format_number (amount, 3);
        } else if (amount < 1000000) {
            return (Math.round (amount / 10) / 100).toFixed (2) + "k";
        } else {
            return (Math.round (amount / 10000) / 100).toFixed (2) + "M";
        }
    },

    format_volume_cn (amount) {

        if (amount < 1000) {
            return this.format_number (amount, 3);
        }
        else if (amount < 10000) {
            return Math.round (amount / 1000).toFixed (2) + "千";
        }
        else if (amount < 100000) {
            return Math.round (amount / 10000).toFixed (2) + "万";
        }
        else if (amount < 100 * 10000) {
            return Math.round (amount / 10 / 10000).toFixed (2) + "十万";
        }
        else if (amount < 1000 * 10000) {
            return Math.round (amount / 100 / 10000).toFixed (2) + "百万";
        }
        else if (amount < 10000 * 10000) {
            return Math.round (amount / 1000 / 10000).toFixed (2) + "千万";
        }
        else {
            return Math.round (amount / 10000 / 10000).toFixed (2) + "亿";
        }
    },

    format_number: (number, decimals, trailing_zeros = true) => {
        if (isNaN (number) || !isFinite (number) || number === undefined || number === null) return "";
        let zeros = ".";
        for (var i = 0; i < decimals; i++) {
            zeros += "0";
        }
        let num = numeral (number).format ("0,0" + zeros);
        if (num.indexOf ('.') > 0 && !trailing_zeros)
            return num.replace (/0+$/, "").replace (/\.$/, "");
        return num;
    },

    format_asset: function (amount, asset, noSymbol, trailing_zeros = true) {
        let symbol;
        let digits = 0;
        if (asset === undefined)
            return undefined;
        if ('symbol' in asset) {
            // console.log( "asset: ", asset )
            symbol = asset.symbol;
            digits = asset.precision;
        }
        else {
            // console.log( "asset: ", asset.toJS() )
            symbol = asset.get ('symbol');
            digits = asset.get ('precision');
        }
        let precision = this.get_asset_precision (digits);
        // console.log( "precision: ", precision )

        return `${this.format_number (amount / precision, digits, trailing_zeros)}${!noSymbol ? " " + symbol : ""}`;
    },

    format_price: function (quoteAmount, quoteAsset, baseAmount, baseAsset, noSymbol, inverted = false, trailing_zeros = true) {
        if (quoteAsset.size) quoteAsset = quoteAsset.toJS ();
        if (baseAsset.size) baseAsset = baseAsset.toJS ();

        let precision = this.get_asset_precision (quoteAsset.precision);
        let basePrecision = this.get_asset_precision (baseAsset.precision);

        if (inverted) {
            if (parseInt (quoteAsset.id.split (".")[2], 10) < parseInt (baseAsset.id.split (".")[2], 10)) {
                return `${this.format_number ((quoteAmount / precision) / (baseAmount / basePrecision), Math.max (5, quoteAsset.precision), trailing_zeros)}${!noSymbol ? "" + quoteAsset.symbol + "/" + baseAsset.symbol : ""}`;
            } else {
                return `${this.format_number ((baseAmount / basePrecision) / (quoteAmount / precision), Math.max (5, baseAsset.precision), trailing_zeros)}${!noSymbol ? "" + baseAsset.symbol + "/" + quoteAsset.symbol : ""}`;
            }
        } else {
            if (parseInt (quoteAsset.id.split (".")[2], 10) > parseInt (baseAsset.id.split (".")[2], 10)) {
                return `${this.format_number ((quoteAmount / precision) / (baseAmount / basePrecision), Math.max (5, quoteAsset.precision), trailing_zeros)}${!noSymbol ? "" + quoteAsset.symbol + "/" + baseAsset.symbol : ""}`;
            } else {
                return `${this.format_number ((baseAmount / basePrecision) / (quoteAmount / precision), Math.max (5, baseAsset.precision), trailing_zeros)}${!noSymbol ? "" + baseAsset.symbol + "/" + quoteAsset.symbol : ""}`;
            }
        }
    },

    price_text: function (price, base, quote) {
        let maxDecimals = 8;
        let priceText;
        let quoteID = quote.toJS ? quote.get ("id") : quote.id;
        let quotePrecision = quote.toJS ? quote.get ("precision") : quote.precision;
        let baseID = base.toJS ? base.get ("id") : base.id;
        let basePrecision = base.toJS ? base.get ("precision") : base.precision;
        let fixedPrecisionAssets = {
            "1.3.113": 5, // bitCNY
            "1.3.121": 5 // bitUSD
        };
        if (quoteID === "1.3.1") {
            priceText = this.format_number (price, quotePrecision);
        } else if (baseID === "1.3.1") {
            priceText = this.format_number (price, Math.min (maxDecimals, quotePrecision + 2));
        } else if (fixedPrecisionAssets[quoteID]) {
            priceText = this.format_number (price, fixedPrecisionAssets[quoteID]);
        } else {
            priceText = this.format_number (price, Math.min (maxDecimals, quotePrecision + basePrecision));
        }
        return priceText;
    },

    price_to_text: function (price, base, quote, forcePrecision = null) {
        if (typeof price !== "number" || !base || !quote) {
            return;
        }

        if (price === Infinity) {
            price = 0;
        }
        let precision;
        let priceText;

        if (forcePrecision) {
            priceText = this.format_number (price, forcePrecision);
        } else {
            priceText = this.price_text (price, base, quote);
        }
        let price_split = priceText.split (".");
        let int = price_split[0];
        let dec = price_split[1];
        let i;

        let zeros = 0;
        if (dec) {
            if (price > 1) {
                let l = dec.length;
                for (i = l - 1; i >= 0; i--) {
                    if (dec[i] !== "0") {
                        break;
                    }
                    zeros++;
                }
                ;
            } else {
                let l = dec.length;
                for (i = 0; i < l; i++) {
                    if (dec[i] !== "0") {
                        i--;
                        break;
                    }
                    zeros++;
                }
                ;
            }
        }

        let trailing = zeros ? dec.substr (Math.max (0, i + 1), dec.length) : null;

        if (trailing) {
            if (trailing.length === dec.length) {
                dec = null;
            } else if (trailing.length) {
                dec = dec.substr (0, i + 1);
            }
        }

        return {
            text: priceText,
            int: int,
            dec: dec,
            trailing: trailing,
            full: price
        };
    },

    get_op_type: function (object) {
        let type = parseInt (object.split (".")[1], 10);

        for (let id in object_type) {
            if (object_type[id] === type) {
                return id;
            }
        }
    },

    add_comma: function (value) {
        if (typeof value === "number") {
            value = value.toString ();
        }
        value = value.trim ();
        value = value.replace (/,/g, "");
        if (value == "." || value == "") {
            return value;
        }
        else if (value.length) {
            // console.log( "before: ",value )
            let n = Number (value);
            if (isNaN (n))
                return;
            let parts = value.split ('.');
            // console.log( "split: ", parts )
            n = parts[0].replace (/\B(?=(\d{3})+(?!\d))/g, ",");
            if (parts.length > 1)
                n += "." + parts[1];
            // console.log( "after: ",transfer.amount )
            return n;
        }
    },

    parse_float_with_comma: function (value) {
        // let value = new_state.transfer.amount
        value = value.replace (/,/g, "");
        let fvalue = parseFloat (value);
        if (value.length && isNaN (fvalue) && value != ".")
            throw "parse_float_with_comma: must be a number";
        else if (fvalue < 0)
            return 0;

        return fvalue;
    },

    are_equal_shallow: function (a, b) {
        if (!a && b || a && !b) {
            return false;
        }
        if (Array.isArray (a) && Array.isArray (a)) {
            if (a.length > b.length) {
                return false;
            }
        }
        for (var key in a) {
            if (!(key in b) || a[key] !== b[key]) {
                return false;
            }
        }
        for (var key in b) {
            if (!(key in a) || a[key] !== b[key]) {
                return false;
            }
        }
        return true;
    },

    format_date: function (date_str) {
        let date = new Date (date_str);
        return date.toLocaleDateString ();
    },

    format_time: function (time_str) {
        let date = new Date (time_str);
        return date.toLocaleString ();
    },

    limitByPrecision: function (value, assetPrecision) {
        let valueString = value.toString ();
        let splitString = valueString.split (".");
        if (splitString.length === 1 || splitString.length === 2 && splitString[1].length <= assetPrecision) {
            return valueString;
        } else {
            return splitString[0] + "." + splitString[1].substr (0, assetPrecision);
        }
        // let precision = this.get_asset_precision(assetPrecision);
        // value = Math.floor(value * precision) / precision;
        // if (isNaN(value) || !isFinite(value)) {
        //     return 0;
        // }
        // return value;
    },

    estimateFee: function (op_type, options, globalObject) {
        if (!globalObject) return 0;
        let op_code = operations[op_type];
        let currentFees = globalObject.getIn (["parameters", "current_fees", "parameters", op_code, 1]).toJS ();

        let fee = 0;
        if (currentFees.fee) {
            fee += currentFees.fee;
        }

        if (options) {
            for (let option of options) {
                fee += currentFees[option];
            }
        }

        return fee * globalObject.getIn (["parameters", "current_fees", "scale"]) / 10000;
    },

    getFee: function ({opType, options, globalObject, asset, coreAsset, balances}) {
        let coreFee = {asset: "1.3.1"};
        coreFee.amount = this.estimateFee (opType, options, globalObject) || 0;

        if (!asset || asset.get ("id") === "1.3.1") return coreFee; // Desired fee is in core asset

        let cer = asset.getIn (["options", "core_exchange_rate"]).toJS ();
        if (!coreAsset || cer.base.asset_id === cer.quote.asset_id) return coreFee;
        let price = this.convertPrice (coreAsset, cer, null, asset.get ("id"));
        let eqValue = this.convertValue (price, coreFee.amount, coreAsset, asset);
        let fee = {
            amount: Math.floor (eqValue + 0.5),
            asset: asset.get ("id")
        };

        let useCoreFee = true; // prefer CORE fee by default
        if (balances && balances.length) {
            balances.forEach (b => {
                if (b.get ("asset_type") === "1.3.1" && b.get ("balance") < coreFee.amount) { // User has sufficient CORE, use it (cheapeest)
                    useCoreFee = false;
                }
            });

            balances.forEach (b => {
                if (b.get ("asset_type") === fee.asset && b.get ("balance") < fee.amount) { // User has insufficient {asset}, use CORE instead
                    useCoreFee = true;
                }
            });
        }

        return useCoreFee ? coreFee : fee;
    },

    convertPrice: function (fromRate, toRate, fromID, toID) {

        if (!fromRate || !toRate) {
            return null;
        }
        // Handle case of input simply being a fromAsset and toAsset
        if (fromRate.toJS && this.is_object_type (fromRate.get ("id"), "asset")) {
            fromID = fromRate.get ("id");
            fromRate = fromRate.get ("bitasset") ? fromRate.getIn (["bitasset", "current_feed", "settlement_price"]).toJS () : fromRate.getIn (["options", "core_exchange_rate"]).toJS ();
        }

        if (toRate.toJS && this.is_object_type (toRate.get ("id"), "asset")) {
            toID = toRate.get ("id");
            toRate = toRate.get ("bitasset") ? toRate.getIn (["bitasset", "current_feed", "settlement_price"]).toJS () : toRate.getIn (["options", "core_exchange_rate"]).toJS ();
        }

        let fromRateQuoteID = fromRate.quote.asset_id;
        let toRateQuoteID = toRate.quote.asset_id;

        let fromRateQuoteAmount, fromRateBaseAmount, finalQuoteID, finalBaseID;
        if (fromRateQuoteID === fromID) {
            fromRateQuoteAmount = fromRate.quote.amount;
            fromRateBaseAmount = fromRate.base.amount;
        } else {
            fromRateQuoteAmount = fromRate.base.amount;
            fromRateBaseAmount = fromRate.quote.amount;
        }

        let toRateQuoteAmount, toRateBaseAmount;
        if (toRateQuoteID === toID) {
            toRateQuoteAmount = toRate.quote.amount;
            toRateBaseAmount = toRate.base.amount;
        } else {
            toRateQuoteAmount = toRate.base.amount;
            toRateBaseAmount = toRate.quote.amount;
        }

        let baseRatio, finalQuoteAmount, finalBaseAmount;
        if (toRateBaseAmount > fromRateBaseAmount) {
            baseRatio = toRateBaseAmount / fromRateBaseAmount;
            finalQuoteAmount = fromRateQuoteAmount * baseRatio;
            finalBaseAmount = toRateQuoteAmount;
        } else {
            baseRatio = fromRateBaseAmount / toRateBaseAmount;
            finalQuoteAmount = fromRateQuoteAmount;
            finalBaseAmount = toRateQuoteAmount * baseRatio;
        }

        return {
            quote: {
                amount: finalQuoteAmount,
                asset_id: toID
            },
            base: {
                amount: finalBaseAmount,
                asset_id: fromID
            }
        };
    },

    convertValue: function (priceObject, amount, fromAsset, toAsset) {
        priceObject = priceObject.toJS ? priceObject.toJS () : priceObject;
        let quotePrecision = this.get_asset_precision (fromAsset.get ("precision"));
        let basePrecision = this.get_asset_precision (toAsset.get ("precision"));

        let assetPrice = this.get_asset_price (priceObject.quote.amount, fromAsset, priceObject.base.amount, toAsset);

        let eqValue = fromAsset.get ("id") !== toAsset.get ("id") ?
            basePrecision * (amount / quotePrecision) / assetPrice :
            amount;

        if (isNaN (eqValue) || !isFinite (eqValue)) {
            return null;
        }
        return eqValue;
    },

    isValidPrice (rate) {
        if (!rate || !rate.toJS) {
            return false;
        }
        let base = rate.get ("base").toJS ();
        let quote = rate.get ("quote").toJS ();
        if ((base.amount > 0 && quote.amount > 0) && (base.asset_id !== quote.asset_id)) {
            return true;
        } else {
            return false;
        }
    },

    sortText (a, b, inverse = false) {
        if (a > b) {
            return inverse ? 1 : -1;
        } else if (a < b) {
            return inverse ? -1 : 1;
        } else {
            return 0;
        }
    },

    sortID (a, b, inverse = false) {
        // inverse = false => low to high
        let intA = parseInt (a.split (".")[2], 10);
        let intB = parseInt (b.split (".")[2], 10);

        return inverse ? (intB - intA) : (intA - intB);
    },

    calc_block_time (block_number, globalObject, dynGlobalObject) {
        if (!globalObject || !dynGlobalObject) return null;
        const block_interval = globalObject.get ("parameters").get ("block_interval");
        const head_block = dynGlobalObject.get ("head_block_number");
        const head_block_time = new Date (dynGlobalObject.get ("time") + "+00:00");
        const seconds_below = (head_block - block_number) * block_interval;
        return new Date (head_block_time - seconds_below * 1000);
    },

    get_translation_parts (str) {
        let result = [];
        let toReplace = {};
        let re = /{(.*?)}/g;
        let interpolators = str.split (re);
        // console.log("split:", str.split(re));
        return str.split (re);
        // var str = '{{azazdaz}} {{azdazd}}';
        // var m;

        // while ((m = re.exec(str)) !== null) {
        //     if (m.index === re.lastIndex) {
        //         re.lastIndex++;
        //     }
        //     console.log("m:", m);
        //     // View your result using the m-variable.
        //     // eg m[0] etc.
        //     //
        //     toReplace[m[1]] = m[0]
        //     result.push(m[1])
        // }

        // return result;
    },

    get_percentage (a, b) {
        return Math.round ((a / b) * 100) + "%";
    },

    replaceName (name, isBitAsset = false) {
        let toReplace = ["TRADE.", "OPEN.", "METAEX."];
        let suffix = "";
        let i;
        for (i = 0; i < toReplace.length; i++) {
            if (name.indexOf (toReplace[i]) !== -1) {
                name = name.replace (toReplace[i], "") + suffix;
                break;
            }
        }

        let prefix = isBitAsset ? "bit" : toReplace[i] ? toReplace[i].toLowerCase () : null;
        if (prefix === "open.") prefix = "";

        return {
            name,
            prefix
        };
    },

    /**
     *验证组织机构代码是否合法：组织机构代码为8位数字或者拉丁字母+“-”+1位校验码。
     *验证最后那位校验码是否与根据公式计算的结果相符。
     *编码规则请参看
     *http://wenku.baidu.com/view/d615800216fc700abb68fc35.html
     */
    isValidOrgCode: function (orgCode) {
        var ret = false;
        var codeVal = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"];
        var intVal = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35];
        var crcs = [3, 7, 9, 10, 5, 8, 4, 2];
        if (orgCode && orgCode.length == 10) {
            var sum = 0;
            for (var i = 0; i < 8; i++) {
                var codeI = orgCode.substring (i, i + 1);
                var valI = -1;
                for (var j = 0; j < codeVal.length; j++) {
                    if (codeI == codeVal[j]) {
                        valI = intVal[j];
                        break;
                    }
                }
                sum += valI * crcs[i];
            }
            var crc = 11 - (sum % 11);
            switch (crc) {
                case 10: {
                    crc = "X";
                    break;
                }
                default: {
                    break;
                }
            }
            //alert(“crc=”+crc+”,inputCrc=”+orgCode.substring(9));
            if (crc == orgCode.substring (9)) {
                ret = true;
            }
        }
        return ret;
    },

    /**
     *验证营业执照是否合法：营业执照长度须为15位数字，前14位为顺序码，
     *最后一位为根据GB/T 17710 1999(ISO 7064:1993)的混合系统校验位生成算法
     *计算得出。此方法即是根据此算法来验证最后一位校验位是否政正确。如果
     *最后一位校验位不正确，则认为此营业执照号不正确(不符合编码规则)。
     *以下说明来自于网络:
     *我国现行的营业执照上的注册号都是15位的，不存在13位的，从07年开始国
     *家进行了全面的注册号升级就全部都是15位的了，如果你看见的是13位的注
     *册号那肯定是假的。
     *15位数字的含义，代码结构工商注册号由14位数字本体码和1位数字校验码
     *组成，其中本体码从左至右依次为：6位首次登记机关码、8位顺序码。
     * 一、前六位代表的是工商行政管理机关的代码，国家工商行政管理总局用
     * “100000”表示，省级、地市级、区县级登记机关代码分别使用6位行
     * 政区划代码表示。设立在经济技术开发区、高新技术开发区和保税区
     * 的工商行政管理机关（县级或县级以上）或者各类专业分局应由批准
     * 设立的上级机关统一赋予工商行政管理机关代码，并报国家工商行政
     * 管理总局信息化管理部门备案。
     * 二、顺序码是7-14位，顺序码指工商行政管理机关在其管辖范围内按照先
     * 后次序为申请登记注册的市场主体所分配的顺序号。为了便于管理和
     * 赋码，8位顺序码中的第1位（自左至右）采用以下分配规则：
     *　　 1）内资各类企业使用“0”、“1”、“2”、“3”；
     *　　 2）外资企业使用“4”、“5”；
     *　　 3）个体工商户使用“6”、“7”、“8”、“9”。
     * 顺序码是系统根据企业性质情况自动生成的。
     * 三、校验码是最后一位，校验码用于检验本体码的正确性
     *
     *18位编码的校验依据GB 32100-2015
     * 《法人和其他组织统一社会信用代码编码规则》，
     * 统一代码由十八位阿拉伯数字或大写英文字母（不使用I、O、Z、S、V）组成，
     * 包括第1位登记管理部门代码、第2位机构类别代码、第3位~第8位登记管理机关行政区划码、
     * 第9位~第17位主体标识码（组织机构代码）、第18位校验码五个部份。
     */
    isValidBusCode: function (busCode) {
        var ret = false;
        if (busCode.length == 15) {
            var sum = 0;
            var s = [];
            var p = [];
            var a = [];
            var m = 10;
            p[0] = m;
            for (var i = 0; i < busCode.length; i++) {
                a[i] = parseInt (busCode.substring (i, i + 1), m);
                s[i] = (p[i] % (m + 1)) + a[i];
                if (0 == s[i] % m) {
                    p[i + 1] = 10 * 2;
                } else {
                    p[i + 1] = (s[i] % m) * 2;
                }
            }
            if (1 == (s[14] % m)) {
                //营业执照编号正确!
                //alert(“营业执照编号正确!”);
                ret = true;
            } else {
                //营业执照编号错误!
                ret = false;
                //alert(“营业执照编号错误!”);
            }
        } else if (busCode.length == 18) {
            var reg = /^[1-9A-GY]{1}[1239]{1}[1-5]{1}[0-9]{5}[0-9A-Z]{10}$/;
            if (!reg.test (busCode)) {
                ret = false;
            }
            else {
                var str = '0123456789ABCDEFGHJKLMNPQRTUWXY';
                var ws = [1, 3, 9, 27, 19, 26, 16, 17, 20, 29, 25, 13, 8, 24, 10, 30, 28];
                var codes = new Array ();
                codes[0] = busCode.substr (0, busCode.length - 1);
                codes[1] = busCode.substr (busCode.length - 1, busCode.length);
                var sum = 0;
                for (var i = 0; i < 17; i++) {
                    sum += str.indexOf (codes[0].charAt (i)) * ws[i];
                }
                var c18 = 31 - (sum % 31);
                if (c18 == 31) {
                    c18 = 'Y';
                } else if (c18 == 30) {
                    c18 = '0';
                }

                if (str.charAt (c18) != codes[1]) {
                    ret = false;
                }
                else {
                    ret = true;
                }
            }

        }
        return ret;
    },
    /**
     *验证国税税务登记号是否合法:税务登记证是6位区域代码+组织机构代码
     */
    isValidTaxCode: function (taxCode) {
        var ret = false;
        if (taxCode.length == 15 && /\d{6}.test(taxCode.substr(0,6))/ && this.isValidOrgCode (taxCode.substr (5))) {
            ret = true;
        }
        return ret;
    }
};

export default Utils;
