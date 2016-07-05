
    Polymer({

        // ELEMENT
        is: 'xp-script',

        // BEHAVIORS
        behaviors: [
            Polymer.XPSharedBehavior
        ],

        /*********************************************************************/

        /**
         * Fired when the script is loaded.
         *
         * @event xp-script-load
         * @param {Element} firer
         * @param {*} data
         * @param {string} src
         * @bubbles
         */

        /**
         * Fired when the script state changes.
         *
         * @event xp-script-state
         * @param {Element} firer
         * @param {string} state
         * @bubbles
         */

        /*********************************************************************/

        /**
         * Injects the script tag.
         *
         * @method inject
         * @param {boolean} [force = false]
         * @returns {Element}
         */
        inject: function (force) {

            // Checking
            if (this.state === 'pending') { return this; }

            // Vars
            var self     = this,
                callback = self.callback,
                src      = self.src,
                promised = self.promises.hasOwnProperty(src) && !force,
                head     = promised ? null : Polymer.dom(document.head),
                older    = promised ? null : head.querySelector('script[src="' + src + '"]'),
                script   = promised ? null : document.createElement('script'),
                promise  = promised ? self.promises[src] : new Promise(function (resolve) { (callback ? window : script)[callback || 'onload'] = resolve; });

            // Resolving
            self.promises[src] = promise.then(function (data) {

                // Checking
                if (callback) { delete window[callback]; }

                // Setting
                self._setState('loaded');
                self._setData(data);

                // Sharing
                if (callback) { self.share(callback, data); }

                // Firing
                self.fire('xp-script-load', {firer: self, data: data, src: src});

                return data;
            });

            // Checking
            if (promised) { return self; }

            // Removing
            if (older) { head.removeChild(older); }

            // Setting
            script.async = true;
            script.src   = src;

            // Appending
            head.appendChild(script);

            // Setting
            if (self.state !== 'loaded') { self._setState('pending'); }

            return self;
        },

        /*********************************************************************/

        // PROPERTIES
        properties: {

            /**
             * The name of the callback to be executed in a JSONP request.
             *
             * @attribute callback
             * @type string
             */
            callback: {
                type: String
            },

            /**
             * The received data.
             *
             * @attribute data
             * @type *
             * @notifies
             * @readonly
             */
            data: {
                notify: true,
                readOnly: true
            },

            /**
             * If set to true, the script is loaded.
             *
             * @attribute loaded
             * @type boolean
             * @default false
             * @notifies
             * @readonly
             */
            loaded: {
                computed: '_computeLoaded(state)',
                notify: true,
                reflectToAttribute: true,
                type: Boolean,
                value: false
            },

            /**
             * The script's src.
             *
             * @attribute src
             * @type string
             */
            src: {
                observer: '_srcChanged',
                type: String
            },

            /**
             * The script's state.
             *
             * @attribute state
             * @type string
             * @default "idle"
             * @notifies
             * @readonly
             */
            state: {
                notify: true,
                observer: '_stateChanged',
                readOnly: true,
                reflectToAttribute: true,
                type: String,
                value: 'idle'
            }
        },

        /**
         * The map of promises.
         *
         * @property promises
         * @type Object
         * @default {}
         * @readonly
         */
        promises: {},

        /*********************************************************************/

        // COMPUTER
        _computeLoaded: function (state) {
            return state === 'loaded';
        },

        /*********************************************************************/

        // OBSERVER
        _srcChanged: function () {

            // Injecting
            if (this.src) { this.inject(); }
        },

        // OBSERVER
        _stateChanged: function () {

            // Firing
            this.fire('xp-script-state', {firer: this, state: this.state});
        },

        /*********************************************************************/

        // LISTENING
        created: function () {

            // Classifying
            this.classList.add('script');
        }
    });
