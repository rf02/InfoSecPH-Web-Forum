// https://www.npmjs.com/package/hbs-helpers

var helper = {
    if_cond: (v1, op, v2, options) => {
        switch (op) {
            case '==':
                return (v1 == v2) ? options.fn(this) : options.inverse(this);
            case '===':
                return (v1 === v2) ? options.fn(this) : options.inverse(this);
            case '!=':
                return (v1 != v2) ? options.fn(this) : options.inverse(this);
            case '!==':
                return (v1 !== v2) ? options.fn(this) : options.inverse(this);
            case '<':
                return (v1 < v2) ? options.fn(this) : options.inverse(this);
            case '<=':
                return (v1 <= v2) ? options.fn(this) : options.inverse(this);
            case '>':
                return (v1 > v2) ? options.fn(this) : options.inverse(this);
            case '>=':
                return (v1 >= v2) ? options.fn(this) : options.inverse(this);
            case '&&':
                return (v1 && v2) ? options.fn(this) : options.inverse(this);
            case '||':
                return (v1 || v2) ? options.fn(this) : options.inverse(this);
            default:
                return options.inverse(this);
        }
    },
    isInCollection: (value, collection) => {
        let isIn = false;
        collection.forEach(item => {
            if (item._id.toString() === value.toString()) {
                isIn = true;
            }
            console.log(item)
        });
        return isIn;
    },
    isSameId: (id1, id2) => {
        return id1.toString() === id2.toString();
    },
};

module.exports = helper;
