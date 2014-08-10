// Set up log messages model
var LogMessage = Backbone.Model.extend({
    messageText: ""
});
var LogMessages = Backbone.Collection.extend({
  model: LogMessage
});

// Set up server info model
var ServerModel = Backbone.Model.extend({
    initialize: function(){
      this.fetch({success: this.success, error: this.error});
    },
    urlRoot: function(){ return 'http://localhost:8080/info/'},
    success: function(model, response) {
      serverModel.ServerName = response.ServerName;
      serverModel.LiveColor = response.LiveColor;
      serverModel.DeadColor = response.DeadColor;

      logView.logMessage("Getting Game of Life server info succeeded, URL: <i>" + serverModel.urlRoot() + "</i>");
      logView.logMessage("Server name: <i>" + response.ServerName + "</i>");
      logView.logMessage("Server live color: <i>" + response.LiveColor + "</i>");
      logView.logMessage("Server dead color: <i>" + response.DeadColor + "</i>");
    },
    error: function(model, response) {
      logView.logMessage("Getting Game of Life server info failed (" + response.statusText + "), URL: <i>" + serverModel.urlRoot() + "</i>");
    }
});

// Set up board model
var BoardModel = Backbone.Model.extend({
    size: 10,
    possibleSizes: [4, 10, 20],
    animated: true,
    urlRoot: function(){ return 'http://localhost:8080/new/' + this.size},
    success: function(model, response) {
      logView.logMessage("Contacting Game of Life API server succeeded, URL: <i>" + this.urlRoot + "</i>");
    },
    error: function(model, response) {
      logView.logMessage("Contacting Game of Life API server failed (" + response.statusText + "), URL: <i>" + this.urlRoot + "</i>");
    }
});

// Set up log messages view
var LogView = Backbone.View.extend({
  el: '#messages',

  initialize: function(){
    this.infoMessages = new LogMessages();
  },

  logMessage: function(msg) {
    this.infoMessages.add(new LogMessage({messageText: msg}));
    this.render();
  },

  render: function(){
    var html = "";
    for (var i = this.infoMessages.models.length - 1; i >= 0; i--) {
      html += "<tr><td>[" + (i + 1) + "] " + this.infoMessages.models[i].attributes.messageText  + "</td></tr>";
    }
    this.$el.html(html);
  }
});

var BoardSizeView = Backbone.View.extend({
  el: '#boardbuttons',

  initialize: function() {
    this.render();
  },

  events : function () {
    var evts = {};
    var view = this;
    var model = view.model;

    model.possibleSizes.forEach( function(size) {
      evts["click #btn-" + size] = (function(size) {
        return function (event) {
          model.set({"size": size});
        };
      })(size);

    });

    evts["click #btn-stop"] = function() {view.model.set({"animated": false})};
    evts["click #btn-start"] = function() {view.model.set({"animated": true})};

    return evts;
  },

  render: function() {
    var buttonsTemplateStr = "<b>Board size:</b> \
    <div class='btn-group' data-toggle='buttons'> \
    <% _.each(possibleSizes, function(size) { %> \
      <label class='btn btn-default' id='btn-<%= size %>'><input type='radio' name='options'> <%= size %>x<%= size %></label> \
      <% }); \
    %> \
    </div> \
    <div> \
    <b>Animation actions:</b> \
    <div class='btn-group' id='animationbuttons'> \
    <% if (animated) { %> \
      <button type='button' class='btn btn-danger' id='btn-stop'>Stop animation</button> \
    <% } else { %> \
      <button type='button' class='btn btn-success' id='btn-start'>Start animation</button> \
    <% } %> \
    </div> \
    </div>";

    var buttonsTemplate = _.template(buttonsTemplateStr);
    this.$el.html(buttonsTemplate({possibleSizes: this.model.possibleSizes, animated: this.model.animated}));
  }

});

// Set up board view
var BoardView = Backbone.View.extend({
  el: '#gameoflife',

  initialize: function(){
    _.bindAll(this);
    this.listenTo(this.model, 'change', this.modelChanged);
    setInterval(this.refresh, 80);
  },

  refresh: function(){
    var snapshotModel = this.model;
    if (snapshotModel.animated) {
      if (snapshotModel.States == undefined || snapshotModel.States.length != snapshotModel.size) {
        // Size has changed, get a new seed
        this.model.fetch();
      } else {
        if (snapshotModel.hasChanged()) {
          this.model.save();
        }
      }
    }
  },

  modelChanged: function() {
    if (this.model.changed.size != undefined) {
      this.model.size = this.model.changed.size;
      boardSizeView.render();
    } else if (this.model.changed.animated != undefined) {
      this.model.animated = this.model.changed.animated;
      boardSizeView.render();
    } else if (this.model.changed.States != undefined) {
      if (this.model.changed.States.length != this.model.size) {
        console.log("size wrong, this is an old update - discard.");
      } else if (this.model.animated == false) {
        console.log("received an update but animation is stopped - discard.");
      } else {
        this.model.States = this.model.changed.States;
      }
    }
    this.render();
  },

  render: function(){
    var bgColor = function(cellState) {
      if (cellState) {
        return serverModel.LiveColor;
      } else {
        return serverModel.DeadColor;
      }
    };
    var boardTemplate = _.template("\
      <table> \
      <% _.each(states, function(row) { %> \
        <tr> \
        <% row.forEach( function(cell) { %> \
          <td style='background-color:<%= bgColor(cell) %>'></td> \
        <% }); %> \
        </tr> \
      <% }); %> \
      </table>");
    this.$el.html(boardTemplate({states: this.model.States, bgColor: bgColor}));
  }
});

// Start
var boardModel = new BoardModel();
var serverModel = new ServerModel();
var boardView = new BoardView({model: boardModel});
var logView = new LogView();
var boardSizeView = new BoardSizeView({model: boardModel});

