const getSampleVal = function (def) {
    let resultObj = {};
    if (typeof def.sample != 'undefined') {
        return def.sample;
    }
    switch (def.type) {
        case 'string':
            return '';
        case 'integer':
            return 0;
        case 'boolean':
            return true;
        case 'number':
            return 0.0;
            break;
        case 'object':
            if (!def.fields) {
                console.log('异常的Object返回类型定义');
                return null;
            }
            for (var key in def.fields) {
                resultObj[key] = getSampleVal(def.fields[key]);
            }
            return resultObj;
        case 'array':
            if (!def.columns) {
                console.log('异常的数组返回类型定义');
                return [];
            }
            return def.columns.map(function (col) {
                return getSampleVal(col)
            });
        case 'enum':
            if (!def.enums || def.enums.length == 0) {
                console.log('异常的枚举返回类型定义');
                return '';
            }
            return def.enums[0];
        default:
            return null;
    }
}

const genJavaCode = function (id,currentSchema,url) {
    var params = {};
    if (currentSchema) {
        for (var key in currentSchema.input) {
            params[key] = this.getSampleVal(currentSchema.input[key]);
        }
        return [
            `OkHttpClient client = new OkHttpClient();`,
            ``,
            `MediaType mediaType = MediaType.parse("application/json");`,
            `RequestBody body = RequestBody.create(mediaType, ${JSON.stringify(JSON.stringify(params))});`,
            `Request request = new Request.Builder()`,
            `  .url("${url}")`,
            `  .post(body)`,
            `  .addHeader("content-type", "application/json")`,
            `  .build();`,
            ``,
            `Response response = client.newCall(request).execute();`
        ].join('\n');
    }
    else {
        return '//schema context未定义'
    }
}

const genCURLCode = function (id,currentSchema,url) {
    if (currentSchema) {
        var params = {};
        for (var key in currentSchema.input) {
            params[key] = this.getSampleVal(currentSchema.input[key]);
        }
        return [
            `curl -X POST \\`,
            `${url} \\`,
            `-H 'content-type: application/json' \\`,
            `-d '${JSON.stringify(params, null, '  ')}'`
        ].join('\n');
    }
    else {
        return '//schema context未定义'
    }
}

const genNodeCode = function (id,currentScheme,url) {
    if (currentScheme) {
        var params = {};
        for (var key in currentScheme.input) {
            params[key] = getSampleVal(currentScheme.input[key]);
        }

        var options = {
            method: 'POST',
            url:`${url}`,
            header: {'content-type': 'application/json'},
            body: params
        }

        return [
            `var request = require("request");`,
            `var options = ${JSON.stringify(options, null, " ")};`,
            ``,
            `request(options, function (error, response, body) {`,
            `  if (error) throw new Error(error);`,
            `  `,
            `  console.log(body);`,
            `});`
        ].join('\n');
    }
    else {
        return '//schema context未定义'
    }
}

export default{
    getSampleVal,
    genJavaCode,
    genCURLCode,
    genNodeCode
}

