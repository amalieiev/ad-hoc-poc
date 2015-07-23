/**
 * Created by Artem.Malieiev on 7/13/2015.
 */
define(function (require) {
    var Backbone = require('backbone'),
        _ = require('underscore');

    return Backbone.Model.extend({
        idAttribute: 'name',
        defaults: {
            name: '',
            columns: [],
            selected: [],
            relatedTable: null,
            position: {top: 0, left: 0}
        },
        initialize: function () {
            var relatedTableModel = this.collection.chain()
                .without(this)
                .find(function (model, index) {
                    return _.intersection(model.get('columns'), this.get('columns'))[0];
                }.bind(this))
                .value();

            relatedTableModel && this.set('relatedTable', relatedTableModel.get('name'));
        }
    });
});