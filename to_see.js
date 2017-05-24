(function(z, window, document) {

    window.containerNode = ge('container');

    z.pattern  = {
        latin_or_cyrillic     : new RegExp("^(?=.*[A-Za-z])(?=.*[À-ßà-ÿ¸¨]).*$"),
        latin_cyrillic        : new RegExp("(?=^[A-Za-zÀ-ßà-ÿ¸¨_\\-\\s]+$)(?=.*[A-Za-zÀ-ßà-ÿ¸¨]+)"),
        latin_cyrillic_number : new RegExp("(?=^[A-Za-zÀ-ßà-ÿ¸¨0-9_\\-\\s]+$)(?=.*[A-Za-zÀ-ßà-ÿ¸¨0-9]+)"),
        email                 : new RegExp("^[a-z\\'0-9]+([\\._\\-][a-z\\'0-9]+)*@([a-z0-9]+([\\._\\-][a-z0-9]+))+$", "i"),
        password              : new RegExp("(?=^.{6,30}$)(?![.\\t\\r\\n\\f]).*$")
    };
    z.is_desktop = browser.da;

    window.dateTextFormat = function(date){
        var time     = new Date(date),
            day      = time.getDate(),
            month    = time.getMonth() + 1,
            minutes  = time.getMinutes(),
            cur_date = new Date(),
            time_passed = (cur_date.getTime() - time.getTime()) / 1000,
            date_str  = date,
            date_arr2 = [],
            date_arr  = [];

        minutes = minutes < 10 ? '0' + minutes : minutes;

        if (isNaN(time.getTime())) {}
        else if (time_passed < 60) { // 1 min
            date_str = Math.floor(time_passed) + '|S_SEC|AGO';
        }
        else if (time_passed < 3600) { // 1 hour
            date_str = Math.ceil(time_passed / 60) + '|S_MIN|AGO';
        }
        else if (cur_date.getDate() - 1 == time.getDate() && cur_date.getMonth() == time.getMonth() && cur_date.getFullYear() == time.getFullYear()) { // yesterday
            date_str = 'S_YESTERDAY|IN|' + time.getHours() + ':' + minutes;
        }
        else if (time_passed < 86400) { // 1 day
            date_str = Math.ceil(time_passed / 3600) + '|S_HOUR|AGO';
        }
        else if (time_passed < 604800) { // 7 days
            date_str = Math.floor(time_passed / 86400) + '|S_DAY|AGO';
        }
        else if (cur_date.getFullYear() == time.getFullYear()) {
            date_str =  day + '|S_MONTH' + month + '|IN|' + time.getHours() + ':' + minutes;
        } else {
            date_str =  time.getDate() + '|S_MONTH' + month + '|' + time.getFullYear();
        }

        if (date_str.length) {
            date_arr = date_str.split('|');
            for(var i = 0; i < date_arr.length; i++) {
                date_arr2.push(getLang(date_arr[i]));
            }

            return date_arr2.join(' ');
        }
        return date;
    };

    window.days_calc = function(yearDom, monthDom, dayDom, include_empty) {
        include_empty = include_empty || false;
        var r_year         = ge(yearDom);
        var r_month        = ge(monthDom);
        var r_day          = ge(dayDom);
        var curYearIndex   = r_year.selectedIndex;
        var curMonthIndex  = r_month.selectedIndex;
        var curDay         = r_day.selectedIndex;
        var curDate        = new Date;
        var curYear        = r_year[curYearIndex].value;
        //var curMonth       = r_month[curMonthIndex].value;
        var timeA          = new Date(r_year[curYearIndex].value, r_month[curMonthIndex].value, 1);
        var timeDifference = timeA - 86400000+3600000;
        var timeB          = new Date(timeDifference);
        var daysInMonth    = timeB.getDate();
        for (var i = 0; i < r_day.length; i++) {
            r_day[0] = null;
        }

        // days
        if (include_empty) {
            r_day[0] = new Option(getLang('DAY'));
            daysInMonth++;
            for (i = 1; i < daysInMonth; i++) {
                r_day[i] = new Option(i);
            }
        } else {
            for (i = 0; i < daysInMonth; i++) {
                r_day[i] = new Option(i+1);
            }
        }

        r_day.selectedIndex = curDay;
        if (r_day.value.toString().length == 0) {
            r_day.selectedIndex++;
        }

        // months
        for(i = 0; i < r_month.children.length; i++) {
            r_month.children[i].disabled = (r_month.children[i].value - 1) > curDate.getMonth() && curYear == curDate.getFullYear();
        }

        r_day.children[0].value = 0;
        for(i = 1; i < r_day.children.length; i++) {
            r_day.children[i].value = r_day.children[i].text;
        }
    };

    // ACCOUNT - set balance, get balance, refresh balance, get currency, get access
    z.fn.Account = function() { //balance, currency{id,name}
        this.Dom = {
            header_login : ge('header-login'),
            header_your_data_alert : ge('header-menu-your-data-alert')
        };
        this.url = {
            data : 'ajax/account/data'
        };
        this.load();
        this.doOnLoad = [];
        this.loaded = 0;

        this.personal_domain = undefined;

        //this.timezone_local = (new Date().getTimezoneOffset()/60)*(-1);
        //this.date_offset    = this.timezone*60*60*1000;
    };
    z.fn.Account.prototype = {
        constructor : z.fn.Account,
        init : function (data) {
            var i, alert = [];

            for(i in data) {
                this[i] = data[i];
            }
            this.access  = this.access  != null ? intval(this.access)       : 0;
            this.regok   = this.regok   != null ? intval(this.regok)        : 1;
            this.balance = this.balance != null ? parseAmount(this.balance) : 0;
            this.first_bet_time = this.first_bet_time != null ? intval(this.first_bet_time) : 0;
            
            if (this.access && this.Dom.header_login) {
                this.Dom.header_login.innerHTML = this.login;
            }
            if (typeof this.currency_id == 'undefined') {
                this.currency_id = 2;
            }

            z.currency = window.currency_data[this.currency_id] ? window.currency_data[this.currency_id] : undefined;
            z.currency.exchange = z.currency.exchange ? parseFloat(z.currency.exchange) : 0;

            z.load(z, 'account_balance', 'Account_balance', {
                status : this.access
            });

            z.load(z, 'logout_hash', 'logout_hash', {
                hash : this.logout_hash
            });
            z.load(z, 'header_balance', 'Header_balance', {
                status : this.access,
                state : this.settings ? this.settings.show_header_balance : 0
            });

            if (this.settings) {
                z.load(z, 'account_settings', 'Account_settings', this.settings);
            }

            if (this.first_bet_time > 0) {
                this.first_bet = new z.fn.Account_first_bet({ time : this.first_bet_time });
            }
            if (this.free_bet_time > 0) {
                this.free_bet = new z.fn.Account_free_bet({
                    time : this.free_bet_time,
                    amount : this.free_bet_amount,
                    currency_name : z.currency.name
                });
            }

            z.account_balance.setHTML();

            /**
             * Personal domain
             */
            if (this.personal_domain && this.personal_domain.length && location.hostname != this.personal_domain) {
                z.custom_message.add(
                    'account_personal_domain',
                    getLang('USE_YOUR_PERSONAL_DOMAIN') + ': <a href="https://' + this.personal_domain + '">' + this.personal_domain + '</a>'
                );
            }
            
            if (this.is_active_email_code) {
                alert.push('<div>' + getLang('CONFIRM_NEW_EMAIL') + '</div>');
            }
            else if (this.is_email_verified == false) {
                alert.push('<div>' + getLang('CONFIRM_EMAIL2') + '</div>');
            }
            if (this.is_phone_verified == false) {
                alert.push('<div>' + getLang('CONFIRM_PHONE_NUMBER') + '</div>');
            }
            if (alert.length) {
                removeClass(this.Dom.header_your_data_alert, 'hidden');
                this.your_data_alert = new z.fn.Tooltip(this.Dom.header_your_data_alert.id, {
                    id        : this.Dom.header_your_data_alert.id,
                    text      : alert.join(''),
                    className : '',
                    placement  : 'bottom',
                    marginTop : -16
                });
            }

            /**
             * Email verification
             */
            if (['index/index', 'account/index', 'payment/index'].indexOf(z.route) != -1) {}
            else if (this.is_email == 0) {
                z.custom_message.add(
                    'account_email_not_verified',
                    getLang('SPECIFY_YOUR_EMAIL') + '. <a href="/account/email">' + getLang('MOVE_ON') + '</a>'
                );
            }
            else if (this.is_active_email_code == 1) {
                z.custom_message.add(
                    'account_email_not_verified',
                    getLang('VERIFY_YOUR_EMAIL') + '. <a href="/account/email/confirm">' + getLang('MOVE_ON') + '</a>'
                );
            }
            else if (this.is_email_verified == 0) {
                z.custom_message.add(
                    'account_email_not_verified',
                    getLang('VERIFY_YOUR_EMAIL') + '. <a href="/account/email">' + getLang('MOVE_ON') + '</a>'
                );
            }

            for(i = 0; i < this.doOnLoad.length; i++) {
                if (typeof this.doOnLoad[i] == 'function') {
                    this.doOnLoad[i]();
                }
            }

            this.loaded = 1;
        },
        afterLoad : function(callback) {
            if (typeof callback == 'function') {
                if (this.loaded == 0) {
                    this.doOnLoad.push(callback);
                } else {
                    callback();
                }
            }
        },
        load : function() {
            var a = this;
            z.ajaxf.send({
                url     : this.url.data,
                silent  : 1,
                cache   : 0,
                data    : {},
                success : function(data) {
                    if (data.code == 'OK') {
                        a.init(data.result);
                    }
                }
            });
        },
        get : function(key) {
            return isset(this[key]) ? this[key] : null;
        },
        isRegok : function() {
            return ((this.regok == 1 && this.access == 1) || this.access == 0);
        },
        changeDate : function(dom, format) { // dynamically change date by local time
            dom = ge(dom);

            var offset = (new Date).getTimezoneOffset() + this.timezone*60;
            if (dom !== null && format && isset(this.timezone) && this.timezone !== 4) {
                var time = parseInt(dom.getAttribute('data-time'))*1000;
                if (time && time > 0) {
                    time+=(offset*60*1000);
                    dom.innerHTML = moment(time).format(format);
                }
            }
        },
        changeDateByClass : function(class_name, format) {
            if (isset(this.timezone) && this.timezone !== 4) {
                var dateDom = geByClass(class_name);
                if (isArray(dateDom)) {
                    for(var i in dateDom) {
                        z.a.changeDate(dateDom[i], format);
                    }
                }
            }
        }
    };

    // ACCOUNT - set balance, get balance, refresh balance, get currency, get access
    z.fn.Account_balance = function(config) { //balance, currency{id,name}
        this.config = {
            status : config.status,
            id : {
                balance  : 'account-balance',
                loading  : 'account-balance-loading'
            },
            url : {
                get  : 'ajax/account/balance',
                get2 : 'ajax/account/balance2'
            },
            class : {
                cont : 'account-balance-cont'
            },
            autorefresh_time : 20000
        };

        this.status = this.config.status;
        this.url = this.config.url;
        this.Dom = getDom(this.config.id);
        this.Dom.balance_containers  = [];

        if (this.Dom.balance !== null) {
            this.addContainer(this.Dom.balance);
        }

        var a = this,
            cont = geByClass(this.config.class.cont);

        if (this.status) {
            for (var i in cont) {
                removeClass(cont[i], 'hidden');
            }
        }

        setInterval(function(){
            a.refresh();
        }, this.config.autorefresh_time);
    };
    z.fn.Account_balance.prototype = {
        constructor : z.fn.Account_balance,
        addContainer : function(balance_dom) {
            balance_dom  = ge(balance_dom);
            if (balance_dom !== null) {
                this.Dom.balance_containers.push(balance_dom);
                balance_dom.innerHTML = this.formatWithCurrency(z.a.balance);
            }
        },
        refresh2 : function(callback) {
            if (this.status == 0) { return; }

            this.loading(1);

            var a = this;
            z.ajaxf.send({
                url     : this.url.get2,
                silent  : 1,
                data    : {},
                success : function(data) {
                    if (data.code && data.code == 'OK' && data.result) {
                        a.set(data.result.balance, callback);
                    }
                },
                complete : function() {
                    a.loading(0);
                }
            });
        },
        refresh : function(callback) {
            if (this.status == 0) { return; }

            this.loading(1);

            var a = this;
            z.ajaxf.send({
                url     : this.url.get,
                silent  : 1,
                data    : {},
                success : function(data) {
                    if (data.code && data.code == 'OK' && data.result) {
                        a.set(data.result.balance, callback);
                    }
                },
                complete : function() {
                    a.loading(0);
                }
            });
        },
        format : function(balance) {
            return number_format(balance, 2, ',', ' ');
        },
        formatWithCurrency : function(balance) {
            return number_format(balance, 2, ',', ' ') + ' ' + z.currency.name;
        },
        loading : function(action) {
            //(action ? removeClass : addClass)   (this.Dom.loading,  'hidden');
            //(action ? addClass    : removeClass)(this.Dom.balance,  'hidden');
            //(action ? addClass    : removeClass)(this.Dom.currency, 'hidden');
        },
        set : function(balance, callback) {
            if (balance !== null) {
                z.a.balance = parseFloat(balance);
            }
            this.setHTML();

            if (typeof callback == 'function') {
                callback();
            }
        },
        setHTML : function() {
            var i,
                balance = this.format(z.a.balance),
                balance_with_currency = this.formatWithCurrency(z.a.balance);

            if (this.Dom.balance) {
                this.Dom.balance.innerHTML = balance;
            }
            for(i in this.Dom.balance_containers) {
                if (this.Dom.balance_containers[i] !== null) {
                    this.Dom.balance_containers[i].innerHTML = balance_with_currency;
                }
            }
        }
    };

    z.fn.Account_bets_printer = function(config) {
        this.config = {
            url : {
                ajax : 'ajax/account/bets'
            },
            data_keys : ['date','status','month','year'],
            status : {
                0 : getLang('RESULT_EXPECTED'),
                1 : getLang('FOR_PAYMENT'),
                2 : getLang('FOR_PAYMENT'),
                3 : getLang('BET_REJECTED'),
                4 : getLang('BET_UNDER_CONSIDERATION')
            },
            bet_type :{
                0 : getLang('BET_SINGLE'),
                1 : getLang('BET_EXPRESS'),
                2 : getLang('BET_SYSTEM'),
                3 : getLang('BET_CHAIN')
            },
            game_status : {
                0 : '<span style="color:#000000;">H</span>', // not played yet
                1 : '<span style="color:#0163B7;">+</span>', // guessed
                2 : '<span style="color:#FF0000;">-</span>', // not guessed
                3 : '<span style="color:#BBBB00;">B</span>', // money returned
                4 : '<span style="color:#000099;">+</span>', // guessed
                5 : '<span style="color:#000099;">+</span>', // guessed
                9 : '<span style="color:#000000;">H</span>'  // not played yet
            },
            html : {
                sport : ''
                + '<tr class="account-bets-bet-sport">'
                + '<td colspan="6">{sport_name}. {league_name}</td>'
                + '</tr>'
                ,
                game : ''
                + '<tr class="account-bets-bet-game">'
                + '<td class="account-bets-bet-game-date">{game_date}</td>'
                + '<td class="account-bets-bet-game-event">'
                + '{game_event}'
                + '<div class="account-bets-bet-game-score">'
                + '<div class="account-bets-bet-game-score-live fl_r {game_live_score_hidden}">live</div>'
                + '{game_score}'
                + '</div>'
                + '</td>'
                + '<td colspan="2" class="account-bets-bet-game-event-mobile">'
                + '{game_event}<br/>'
                + '<span class="account-bets-bet-game-score">{game_score}</span>'
                + '</td>'
                + '<td class="account-bets-bet-game-name-cont">'
                + '<div class="account-bets-bet-game-name" title="{game_name}">{game_name}</div>'
                + '</td>'
                + '<td class="account-bets-bet-game-cf">{game_cf}</td>'
                + '<td class="account-bets-bet-game-status">{game_status_name}</td>'
                + '</tr>'
                + '<tr class="account-bets-bet-game-mobile">'
                + '<td colspan="2">'
                + '<div class="fl_r account-bets-bet-game-cf">{game_cf}</div>'
                + '<div class="account-bets-bet-game-name" title="{game_name}">{game_name}</div>'
                + '</td>'
                + '<td class="account-bets-bet-game-status">{game_status_name}</td>'
                +'</tr>'
                ,
                bet : ''
                + '<div class="account-bets-item">'
                + '<div class="account-bets-bet-header">'
                + '<div class="account-bets-bet-number fl_r">'
                + '{bet_vip}' + getLang('BET') + ' ' + '#{bet_number}'
                + '</div>'
                + '<div class="account-bets-bet-status-{bet_status}">'
                + '<span class="account-bets-bet-name">'
                + '<a href="#" class="promo-1-rules-open">{bet_free_bet}</a> '
                + '{bet_type}'
                + '{bet_system}'
                + '</span>'
                + getLang('FOR_AMOUNT')
                + '<span class="account-bets-bet-amount">'
                + '{bet_amount_set}'
                + '</span>'
                + '<span class="account-bets-bet-currency">'
                + '{currency_name}.'
                + '</span>'
                + '<span class="account-bets-bet-result">'
                + '{bet_status_name}'
                + '{bet_amount_win}'
                + '</span>'
                + '</div>'
                + '</div>'
                + '<div class="account-bets-bet-body">'
                + '<table class="account-bets-bet-games">'
                + '<tbody>'
                + '{games_html}'
                + '<tr class="account-bets-bet-data">'
                + '<td colspan="6">'
                + '<div class="fl_r account-bets-bet-total-cf">{bet_total_cf}</div>'
                + '<div class="account-bets-bet-date" title="' + getLang('BET_TIME') + ': {bet_date}">{bet_date_text}</div>'
                + '</td>'
                + '</tr>'
                + '</tbody>'
                + '</table>'
                + '</div>'
                + '</div>'
                ,
                toto : ''
                + '<div class="account-bets-item">'
                + '<div class="account-bets-bet-header">'
                + '<div class="account-bets-toto-number fl_r">'
                + '<a target="_blank" href="' + doUrl('toto/bet') + '/{bet_id}">'
                + getLang('CARD') + ' {bet_number}'
                + '</a>'
                + '</div>'
                + '<div class="account-bets-bet-status-{bet_status}">'
                + '<span class="account-bets-bet-name">'
                + getLang('TOTO')
                + '</span>'
                + getLang('FOR_AMOUNT')
                + '<span class="account-bets-bet-amount">{bet_amount_set}</span>'
                + '<span class="account-bets-bet-currency">{currency_name}.</span>'
                + '<span class="account-bets-bet-result">'
                + '{bet_status_name} {bet_amount_win}'
                + '</span>'
                + '</div>'
                + '</div>'
                + '<div class="account-bets-bet-body">'
                + '<div class="account-bets-toto-data">'
                + '<span class="account-bets-bet-toto-name">{bet_name}</span>'
                + '</div>'
                + '<div>'
                + '<div class="account-bets-bet-date" title="' + getLang('BET_TIME') + ': {bet_date}">{bet_date_text}</div>'
                + '</div>'
                + '</div>'
                + '</div>'
            }
        };
        this.config = extend(this.config, config);

        this.url         = this.config.url;
        this.status      = this.config.status;
        this.bet_type    = this.config.bet_type;
        this.game_status = this.config.game_status;
        this.html        = this.config.html;
        this.data        = {
            status : 1,
            date   : 1
        };

        z.template.add({
            id   : 'account_bets_sport',
            html : this.config.html.sport
        });
        z.template.add({
            id   : 'account_bets_bet',
            html : this.config.html.bet
        });
        z.template.add({
            id   : 'account_bets_game',
            html : this.config.html.game
        });
        z.template.add({
            id   : 'account_bets_toto',
            html : this.config.html.toto
        });

        var a = this;
    };
    z.fn.Account_bets_printer.prototype = {
        constructor : z.fn.Account_bets_printer,
        printBet : function(bet, games_html) {
            return z.template.show('account_bets_bet', {
                bet_type        : this.bet_type[bet.type],
                bet_status_name : this.status[bet.status],
                bet_system      : (bet.type == 2 ? ' ' + bet.system : ''),
                bet_amount_set  : '<b>' + number_format(bet.amount_set, 2, ',', ' ') + '</b>',
                bet_amount_win  : (bet.status == 1 || bet.status == 2 ? (': <b>' + number_format(bet.amount_win, 2, ',', ' ') + '</b> ' + z.currency.name) : ''),
                bet_total_cf    : (bet.type == 1 ? ('K=' + number_format(bet.total_cf, 2, ',', ' ')) : ''),
                bet_free_bet    : bet.free_bet ? getLang('FREE_BET') + ': ' : '',
                bet_vip         : '',//bet.vip ? 'VIP-' : '',
                bet_number      : bet.number,
                bet_status      : bet.status,
                bet_date        : bet.date,
                bet_date_text   : bet.date_text,
                games_html      : games_html,
                currency_name   : z.currency.name
            });
        },
        printGame : function(game) {
            return z.template.show('account_bets_game', {
                game_date        : game.date,
                game_event       : game.event,
                game_score       : game.score,
                game_name        : game.name,
                game_cf          : number_format(game.cf, 2, ',', ' '),
                game_status_name : this.game_status[game.status],
                sport_name       : this.sport_name[game.sport_id],
                league_name      : this.league_name[game.league_id],
                game_live_score_hidden : game.live_score ? '' : 'hidden'
            });
        },
        printSportLeague : function(game) {
            return z.template.show('account_bets_sport', {
                sport_name  : this.sport_name[game.sport_id],
                league_name : this.league_name[game.league_id]
            });
        },
        printLine : function(bet) {
            var games_html = '',
                sport_id   = 0,
                league_id  = 0;

            for(var j in bet.games) {
                var game = bet.games[j];
                if (sport_id + '' + league_id != game.sport_id + '' + game.league_id && this.sport_name[game.sport_id] && this.league_name[game.league_id]) {
                    games_html += this.printSportLeague(game);
                }

                league_id = game.league_id;
                sport_id  = game.sport_id;

                games_html += this.printGame(game);
            }

            return this.printBet(bet, games_html);
        },
        printToto : function(bet) {
            return z.template.show('account_bets_toto', {
                bet_number      : bet.number,
                bet_id          : bet.id,
                bet_name        : bet.name,
                bet_date        : bet.date,
                bet_status      : bet.status,
                bet_amount_set  : '<b>' + number_format(bet.amount_set, 2, ',', ' ') + '</b>',
                bet_amount_win  : (bet.status > 0 ? (' - <b>' + number_format(bet.amount_win, 2, ',', ' ') + '</b> ' + z.currency.name) : ''),
                bet_date_text   : bet.date_text,
                currency_name   : z.currency.name,
                bet_status_name : this.status[bet.status]
            });
        },
        print : function(data) {
            var bets = data.bets,
                bet,
                html = '';

            this.sport_name  = data.sport;
            this.league_name = data.league;
            for(var i in bets) {
                bet = bets[i];

                bet.date_text  = bet.date_text  ? bet.date_text  : null;
                bet.amount_win = bet.amount_win ? bet.amount_win : null;
                bet.amount_set = bet.amount_set ? bet.amount_set : null;

                if (bet.type == 1) {
                    bet.total_cf = bet.total_cf ? bet.total_cf : null;
                }

                if (bet.type == 9) { // Toto
                    html += this.printToto(bet);
                } else { // Card
                    html += this.printLine(bet);
                }
            }

            return html;
        },
        get : function(callback) {
            var date   = this.data.date,
                status = this.data.status,
                year   = this.data.year,
                month  = this.data.month,
                a = this;

            z.ajaxf.send({
                url     : this.url.ajax,
                data    : {
                    status : status,
                    date   : date,
                    month  : month,
                    year   : year
                },
                success : function(data){
                    if (data.code == 'OK' && data.result && typeof callback == 'function') {
                        callback(data.result, a.print(data.result));
                    }
                }
            });
        },
        set : function(data) {
            var k;
            for(var i=0; i<this.config.data_keys.length; i++) {
                k = this.config.data_keys[i];
                if (isset(data[k])) {
                    this.data[k] = data[k];
                }
            }

            if (this.data.month != '' && !isNumeric(this.data.month)) {
                this.data.month = '';
            }
            if (this.data.year != '' && !isNumeric(this.data.year)) {
                this.data.year = '';
            }
        }
    };

    z.fn.Account_bets_popup = function(config) {
        this.config = {
            id : {
                show  : '',
                count : ''
            },
            status : 1,
            interval : 60000,
            lifetime : 30000
        };
        this.config = extend(this.config, config);
        this.printer = new z.fn.Account_bets_printer();
        this.Dom = getDom(this.config.id);
        this.status = this.config.status;
        this.data = {
            data : {},
            count: 0,
            html : '',
            time : null
        };

        this.setTimeout();
        this.setCount();

        var a = this;
        $(document).on('click', '#' + this.config.id.show, function(){
            a.show();
            return false;
        });
    };
    z.fn.Account_bets_popup.prototype = {
        constructor: z.fn.Account_bets_popup,
        setTimeout : function() {
            (function(t){
                t.timeout = setTimeout(function(){
                    t.get();
                }, t.config.interval);
            })(this);
        },
        clearTimeout : function() {
            clearTimeout(this.timeout);
        },
        get : function(callback) {
            if (!this.status) { return; }
            var a = this,
                now = (new Date).getTime();

            if (this.data.time && now - this.data.time < this.config.lifetime) {
                if (typeof callback == 'function') {
                    callback()
                }
            } else {
                this.clearTimeout();
                this.printer.get(function(data, html) {
                    a.data = {
                        data  : data,
                        html  : html,
                        count : data.bets ? data.bets.length : 0,
                        time  : (new Date).getTime()
                    };

                    if (typeof callback == 'function') {
                        callback();
                    }
                    a.setTimeout();
                });
            }
        },
        show : function() {
            if (!this.status) { return; }

            var a = this;
            this.get(function(){
                a._show();
            });
        },
        addCountFromBasket : function(addCount) {
            if (!this.status) { return; }

            this.data.count += parseInt(addCount);
            this.data.time -= this.config.lifetime;
            this._setCount();
        },
        setCount : function() {
            if (!this.status) { return; }

            var a = this;
            this.get(function(){
                a._setCount();
            });
        },
        toggleButton : function(action) {
            if (!this.status) { return; }
            if (isset(action)) {
                (action ? removeClass : addClass)(this.Dom.show, 'hidden');
            }
        },
        _setCount : function() {
            if (!this.status) { return; }

            var count = this.data.count;

            this.Dom.count.innerHTML = count ? ' (' + count + ')' : '';
            this.toggleButton(count > 0);
        },
        _show : function() {
            if (!this.status) { return; }

            this._setCount();

            z.box.show({
                title : getLang('UNASSIGNED_BETS'),
                html : this.data.html,
                width : z.mobile ? '' : 600,
                show_controls : 0,
                show_header : 1,
                show_header_close : 1,
                wrap_close : 1
            });
        }
    };

    z.fn.Account_messenger = function() {
        this.url = {
            ajax : 'ajax/account/messenger'
        };

        z.load(this, 'notification', 'Notification');
    };
    z.fn.Account_messenger.prototype = {
        constructor : z.fn.Account_messenger,
        printMessages : function(messages) {
            var html, i, message, currency_name = z.a.get('currency_name') ;
            for(i in messages) {
                message = messages[i];
                html = ''
                    + '<div class="clearfix">'
                        + message.text
                    + '</div>';
                this.notification.show({ text : html });
            }
        },
        getMessages : function() {
            var am = this;
            z.ajaxf.send({
                url     : this.url.ajax,
                success : function (data) {
                    if (data.code == 'OK' && data.result && data.result.length) {
                        am.printMessages(data.result);
                    }
                }
            });
        }
    };

    z.fn.Account_settings = function(settings) {
        this.config = {
            keys : [
                'clear_basket_after_bet',
                'load_ross_live',
                'highlight_changes_live',
                'colorize_sport',
                'show_header_balance',
                'show_popup',
                'show_bet_popup',
                'one_click_bet_amount',
                'basket_agree_cf'
            ],
            id : {
                clear_basket_after_bet : 'as-clear-basket-after-bet',
                load_ross_live : 'as-load_ross-live',
                highlight_changes_live : 'as-highlight-changes-live',
                colorize_sport : 'as-colorize-sport',
                show_header_balance : 'as-show-header-balance',
                show_popup : 'as-show-popup',
                show_bet_popup : 'as-show-bet-popup',
                one_click_bet_amount : 'as-one-click-bet-amount',
                basket_agree_cf : 'as-basket-agree-cf',
                success : 'box-account-settings-success'
            },
            class : {
                success_show : 'box-account-settings-success-show'
            },
            url : {
                save : 'ajax/account/settings/save'
            },
            popup : {
                template_name : 'account_settings',
                width : 550,
                title : getLang('ACCOUNT_SETTINGS') + ' - ' + getLang('BM_ZENIT'),
                buttons : '<button id="box_close_button" class="flat_button box_close_button">' + getLang('CLOSE') + '</button>',
                controls: '<div id="box-account-settings-success" class="box-account-settings-success">' + getLang('YOUR_CHANGES_HAVE_BEEN_SAVED') + '</div>'
            },
            timeout_delay : 1000
        };
        this.Dom = null;
        this.timeout = null;
        this.save_timeout = null;
        this.parse();

        var d = geByClass('account-settings-show'),
            as = this;

        for(var i in d) {
            removeClass(d[i], 'hidden');
        }

        $(document).on('click', '.account-settings-show', function() {
            as.showPopup();
        });
        $(document).on('click', '#as-clear-basket-after-bet, #as-load_ross-live, #as-highlight-changes-live, #as-colorize-sport, #as-show-header-balance, #as-show-popup, #as-show-bet-popup', function() {
            as.parseData();
        });
        $(document).on('blur', '#as-one-click-bet-amount', function() {
            as.parseData();
        });
        $(document).on('change', '#as-basket-agree-cf', function() {
            as.parseData();
        });
        $(document).on('click', '#as-colorize-sport-help-toggle', function() {
            toggleClass('as-colorize-sport-help', 'hidden');
        });
        $(document).on('click', '#as-highlight-changes-live-help-toggle', function() {
            toggleClass('as-highlight-changes-live-help', 'hidden');
        });
    };
    z.fn.Account_settings.prototype = {
        constructor : z.fn.Account_settings,
        showPopup : function() {
            var as = this;
            if (!z.template.loaded('account_settings')) {
                z.template.add({
                    id      : 'account_settings',
                    engine  : 'handlebars'
                }, function() {
                    as.showPopup();
                });
            } else {
                z.box.show({
                    title             : this.config.popup.title,
                    html              : z.template.show(this.config.popup.template_name, {}),
                    width             : z.mobile ? '' : this.config.popup.width,
                    show_controls     : 1,
                    buttons_html      : this.config.popup.buttons,
                    controls_text     : this.config.popup.controls,
                    show_header       : 1,
                    show_header_close : 1,
                    wrap_close        : 1,
                    callback          : {
                        common : function() {
                            as.Dom = null;
                        }
                    }
                });

                this.Dom = getDom(this.config.id);

                checkbox(this.Dom.clear_basket_after_bet, z.a.settings.clear_basket_after_bet);
                checkbox(this.Dom.highlight_changes_live, z.a.settings.highlight_changes_live);
                checkbox(this.Dom.load_ross_live,         z.a.settings.load_ross_live);
                checkbox(this.Dom.colorize_sport,         z.a.settings.colorize_sport);
                checkbox(this.Dom.show_header_balance,    !z.a.settings.show_header_balance);
                checkbox(this.Dom.show_popup,             z.a.settings.show_popup);
                checkbox(this.Dom.show_bet_popup,         z.a.settings.show_bet_popup);
                this.Dom.one_click_bet_amount.value = z.a.settings.one_click_bet_amount;
                this.Dom.basket_agree_cf.value      = z.a.settings.basket_agree_cf;
            }
        },
        parse : function() {
            if (this.Dom !== null) {
                z.a.settings.clear_basket_after_bet = isChecked(this.Dom.clear_basket_after_bet) ? 1 : 0;
                z.a.settings.load_ross_live         = isChecked(this.Dom.load_ross_live)         ? 1 : 0;
                z.a.settings.highlight_changes_live = isChecked(this.Dom.highlight_changes_live) ? 1 : 0;
                z.a.settings.colorize_sport         = isChecked(this.Dom.colorize_sport)         ? 1 : 0;
                z.a.settings.show_header_balance    = !isChecked(this.Dom.show_header_balance)   ? 1 : 0;
                z.a.settings.show_popup             = isChecked(this.Dom.show_popup)             ? 1 : 0;
                z.a.settings.show_bet_popup         = isChecked(this.Dom.show_bet_popup)         ? 1 : 0;
                z.a.settings.one_click_bet_amount   = this.Dom.one_click_bet_amount.value;
                z.a.settings.basket_agree_cf        = this.Dom.basket_agree_cf.value;
            }

            z.a.settings.clear_basket_after_bet = parseInt(z.a.settings.clear_basket_after_bet);
            z.a.settings.load_ross_live         = parseInt(z.a.settings.load_ross_live);
            z.a.settings.highlight_changes_live = parseInt(z.a.settings.highlight_changes_live);
            z.a.settings.colorize_sport         = parseInt(z.a.settings.colorize_sport);
            z.a.settings.show_header_balance    = parseInt(z.a.settings.show_header_balance);
            z.a.settings.show_popup             = parseInt(z.a.settings.show_popup);
            z.a.settings.show_bet_popup         = parseInt(z.a.settings.show_bet_popup);
            z.a.settings.basket_agree_cf        = parseInt(z.a.settings.basket_agree_cf);
            z.a.settings.one_click_bet_amount   = parseFloat(z.a.settings.one_click_bet_amount);

            if (isset(z.a.settings.show_header_balance)) {
                setCookie('header_balance', z.a.settings.show_header_balance ? '1' : '0');
                if (z.header_balance) {
                    z.header_balance[z.a.settings.show_header_balance ? 'show' : 'hide']();
                }
            }

            if (isset(z.a.settings.clear_basket_after_bet) && z.basket && z.basket.clear_after_bet) {
                z.basket.clear_after_bet.set(z.a.settings.clear_basket_after_bet);
            }
            if (isset(z.a.settings.highlight_changes_live) && z.live_refresh_highlight) {
                z.live_refresh_highlight.toggle(z.a.settings.highlight_changes_live);
            }
            if (isset(z.a.settings.colorize_sport) && z.colorize_sport) {
                z.colorize_sport[z.a.settings.colorize_sport ? 'colorize' : 'deColorize']();
            }
            if (isset(z.a.settings.load_ross_live)) {
                if (z.live_settings) {
                    z.live_settings.ross = z.a.settings.load_ross_live;
                }
                //if (z.ross) {
                //    z.ross.resetSavedGames();
                //}
            }
            if (isset(z.a.settings.basket_agree_cf) && z.basket && z.basket.agree_cf) {
                setCookie('basket_agree_cf', z.a.settings.basket_agree_cf, 30);
                z.basket.agree_cf.set(z.a.settings.basket_agree_cf);
            }
        },
        parseData : function() {
            this.parse();

            clearTimeout(this.timeout);
            (function(t) {
                t.timeout = setTimeout(function() {
                    t.save();
                }, t.config.timeout_delay);
            })(this);

            return this.settings;
        },
        save : function() {
            clearTimeout(this.timeout);

            if (this.Dom) {
                clearTimeout(this.save_timeout);
                addClass(this.Dom.success, 'hidden');
                removeClass(this.Dom.success, this.config.class.success_show);
            }
            show('box_progress');

            var t = this;
            z.ajaxf.send({
                url : this.config.url.save,
                data : {
                    data : z.a.settings
                },
                success : function() {
                    hide('box_progress');
                    if (t.Dom) {
                        removeClass(t.Dom.success, 'hidden');
                        removeClass(t.Dom.success, t.config.class.success_show);
                        addClass(t.Dom.success, t.config.class.success_show);
                        t.save_timeout = setTimeout(function() {
                            if (t.Dom) {
                                removeClass(t.Dom.success, t.config.class.success_show);
                            }
                        }, 3000);
                    }
                },
                complete : function() {
                    hide('box_progress');
                }
            });
        }
    };

    z.fn.logout_hash = function(config) {
        this.hash = config.hash;
        this.add(ge('logout'), this.hash);
    };
    z.fn.logout_hash.prototype = {
        constructor : z.fn.logout_hash,
        add: function(el, hash) {
            if (!el) { return; }
            var href = el.href;
            if (el !== null && !/h=[a-z0-9]{1,32}/.test(href)) {
                href = href+'?h=' + hash;
            }

            el.href = href;
        }
    };

    z.fn.global_message = function() {
        this.config = {
            id : {
                cont   : 'global-message',
                text   : 'global-message-text',
                close  : 'global-message-close'
            }
        };
        this.Dom = getDom(this.config.id);
        this.text = trim(this.Dom.text.innerHTML);
        this.is_index = (this.text.length > 0 && z.route == 'index/index');
        this.cookie_name = 'global-message';
        this.cookie = getCookie(this.cookie_name);

        if (this.cookie) {
            this.status = (this.is_index || this.cookie == '1') ? 1 : 0;
        } else {
            this.status = this.text.length > 0;
        }

        if (this.status) {
            this.set();
        } else {
            this.hide();
        }

        var gm = this;
        $(document).on('click', '#' + this.config.id.close, function(){
            gm.hide();
        });
    };
    z.fn.global_message.prototype = {
        constructor: z.fn.global_message,
        show : function() {
            removeClass(this.Dom.cont, 'hidden');
        },
        hide : function() {
            this.hideHtml();
            setCookie(this.cookie_name, '0');
        },
        hideHtml : function() { // used on some pages where gm must be hidden, but cookie must not be set
            addClass(this.Dom.cont, 'hidden');
        },
        set : function(text) {
            text = text || this.text;
            this.show();
            if (this.Dom.text) {
                this.Dom.text.innerHTML = text;
            }
            if (this.is_index) {
                addClass(this.Dom.close, 'hidden');
            }
        }
    };

    z.fn.top_message = function() {
        this.config = {
            id : {
                cont   : 'top-message',
                text   : 'top-message-text',
                close  : 'top-message-close'
            }
        };
        this.Dom = getDom(this.config.id);
        if (!this.Dom.text) return;
        
        this.text = trim(this.Dom.text.innerHTML);
        this.is_index = (this.text.length > 0 && z.route == 'index/index');
        this.cookie_name = 'global-message';
        this.cookie = getCookie(this.cookie_name);

        if (z.is_desktop) {
            this.status = 0;
            addClass('index-mobile-li', 'hidden');
        }
        else if (this.cookie) {
            this.status = (this.is_index || this.cookie == '1') ? 1 : 0;
        } else {
            this.status = this.text.length > 0;
        }

        if (this.status) {
            this.set();
        } else {
            this.hide();
        }

        var gm = this;
        $(document).on('click', '#' + this.config.id.close, function(){
            gm.hide();
        });
    };
    z.fn.top_message.prototype = {
        constructor: z.fn.top_message,
        show : function() {
            removeClass(this.Dom.cont, 'hidden');
        },
        hide : function() {
            this.hideHtml();
            setCookie(this.cookie_name, '0');
        },
        hideHtml : function() { // used on some pages where gm must be hidden, but cookie must not be set
            addClass(this.Dom.cont, 'hidden');
        },
        set : function(text) {
            text = text || this.text;
            this.show();
            if (this.Dom.text) {
                this.Dom.text.innerHTML = text;
            }
            if (this.is_index) {
                addClass(this.Dom.close, 'hidden');
            }
        }
    };

    z.fn.Custom_message = function() {
        this.config = {
            status : true,
            id : {
                cont   : 'custom-message-cont'
            },
            pre_id : {
                item : 'custom-message-'
            },
            class : {
                cont   : 'custom-message-cont',
                text   : 'custom-message-text',
                close  : 'custom-message-close'
            },
            html : {
                item : ''
                    + '<div id="{_id}" class="custom-message">'
                        + '<div id="custom-message-close" class="custom-message-close" data-id="{id}"></div>'
                        + '<div id="custom-message-text" class="custom-message-text">{text}</div>'
                    + '</div>'
            }
        };
        this.Dom = getDom(this.config.id);
        this.items = {};

        var cm = this;
        $(document).on('click', '.' + this.config.class.close, function(){
            cm.hide(this.getAttribute('data-id'), 'hidden');
        });
    };
    z.fn.Custom_message.prototype = {
        constructor: z.fn.Custom_message,
        setStatus : function(status) {
            this.status = !!status;

            if (!this.status) {
                for(var id in this.items) {
                    var _id = this.config.pre_id.item + id;

                    addClass(_id, 'hidden');
                }
            }
        },
        hide : function(id) {
            if (this.items[id]) {
                var _id = this.config.pre_id.item + id;

                addClass(_id, 'hidden');
                setCookie('custom_message_' + id, '0');
            }
        },
        add : function(id, text) {
            if (this.status == false) {}
            else if (parseInt(getCookie('custom_message_' + id)) === 0) {
                // if closed
            }
            else if (this.Dom.cont) {
                var html = this.config.html.item,
                    _id  = this.config.pre_id.item + id,
                    state = getCookie(_id);

                text = text || this.text;
                html = replaceAll('{id}',   id,   html);
                html = replaceAll('{_id}',  _id,  html);
                html = replaceAll('{text}', text, html);
                state = state !== '0';

                this.Dom.cont.innerHTML += html;
                this.items[id] = {
                    id    : this.config.pre_id.item + id,
                    text  : text,
                    state : state
                };
                (state ? removeClass : addClass)(_id, 'hidden');
            }
        }
    };

    z.fn.Tooltip = function(to, opts) {
        if (!(to = ge(to))) { return; }
        if (!opts) {opts = {};}

        var text = to.title.length > 0 ? to.title : (opts.text ? opts.text : '');
        if (text.length == 0) { return; }

        this.defaults = {
            placement : "right" // top, bottom, left, right
            //trigger   : "focus", // hover, focus
            //delay     : 0
        };

        this.guid++;
        this.size = getSize(to);
        this.text = text;
        this.id   = to.id + '-tooltip';
        this.dop       = opts.dop ? opts.dop : {};
        this.className = opts.className ? opts.className : '';
        this.placement = opts.placement ? opts.placement : this.defaults.placement;
        this.Dom = {};

        this.Dom.container = ce('div', {
            id : this.id,
            className : 'tooltip-container hidden ' + this.className
        });
        this.Dom.tooltip = ce('div', {
            className : 'tooltip ' + this.placement
        });
        this.Dom.arrow = ce('div', {
            className : 'tooltip-arrow'
        });
        this.Dom.inner = ce('div', {
            className : 'tooltip-inner',
            innerHTML : this.text
        });

        this.Dom.tooltip.appendChild(this.Dom.arrow);
        this.Dom.tooltip.appendChild(this.Dom.inner);
        this.Dom.container.appendChild(this.Dom.tooltip);
        if (opts.customParent && ge(opts.customParent)) {
            opts.customParent = ge(opts.customParent);
            opts.customParent.parentNode.insertBefore(this.Dom.container, opts.customParent.nextSibling);
        } else {
            insertAfter(to, this.Dom.container);
        }

        this.to = to;
        // pos.top + pos.height, left: pos.left + pos.width / 2 - actualWidth / 2
        this._reCalc();

        var ids = [to.id];
        for(var i in this.dop) {
            this.dop[i] = ge(this.dop[i]);
            if (this.dop[i]) {
                ids.push(this.dop[i].id);
            }
        }

        var t = this;
        if (to.tagName.toLowerCase() == 'div' || to.tagName.toLowerCase() == 'a') {
            $('#' + ids.join(', #')).hover(function(){
                t.show();
            }, function(){
                t.hide();
            });
        }
        $(document).on('focus', '#' + ids.join(', #') , function(){
            t.show();
        });
        $(document).on('blur', '#' + ids.join(', #'), function(){
            t.hide();
        });
    };
    z.fn.Tooltip.prototype = {
        constructor : z.fn.Tooltip,
        _reCalc: function() {
            removeClass(this.Dom.container, 'hidden');
            var tp = $(this.to).offset(),
                    size_to = getSize(this.to),
                    size_co = getSize(this.Dom.container);  
            addClass(this.Dom.container, 'hidden');
            switch (this.placement) {
                case 'bottom':
                    tp = {
                        top  : tp.top + size_to[1] + 5,
                        left : tp.left + (size_to[0] / 2) - (size_co[0] / 2)
                    };
                    break;
                case 'top':
                    tp = {
                        top  : tp.top - size_co[1] - 5,
                        left : tp.left + (size_to[0] / 2) - (size_co[0] / 2)
                    };
                    break;
                case 'left':
                    tp = {
                        top  : tp.top + (size_to[1] / 2) - (size_co[1] / 2) + 2,
                        left : tp.left - size_to[0] + (size_co[0] / 2)
                    };
                    break;
                case 'right':
                    tp = {
                        top  : tp.top + (size_to[1] / 2) - (size_co[1] / 2) + 2,
                        left : tp.left + size_to[0] + 5
                    };
                    break;
            }
            this.Dom.container.style.top   = tp.top + 'px';
            this.Dom.container.style.left = tp.left + 'px';
        },
        show : function() {
            if (browser.mobile) {return;}
            this._reCalc();
            removeClass(this.Dom.container, 'hidden');
        },
        hide : function() {
            addClass(this.Dom.container, 'hidden');
        }
    };

    z.fn.password_checker = function(settings) {
        this.pattern = settings.pattern;
        this.strength_max = 4;
        this.name = {
            td : 'strength-table-td-'
        };
        this.Dom = {
            td   : {},
            cont : ge(settings.cont),
            keyup_input : ge(settings.keyup_input)
        };
        this.html = '<table id="password-strength-table" class="password-strength-table"><tbody><tr>'
        +'<td id="strength-table-td-1" class="password-strength-td">&nbsp;</td>'
        +'<td id="strength-table-td-2" class="password-strength-td">&nbsp;</td>'
        +'<td id="strength-table-td-3" class="password-strength-td">&nbsp;</td>'
        +'<td id="strength-table-td-4" class="password-strength-td">&nbsp;</td>'
        +'</tr></tbody></table>';
        this.Dom.cont.innerHTML = this.html;

        for(var i = 1; i <= this.strength_max; i++) {
            this.Dom.td[i] = ge(this.name.td + i);
        }

        var pc = this;
        $(document).on('keyup', '#' + this.Dom.keyup_input.id, function() {
            pc.calc_str(this.value);
        })
    };
    z.fn.password_checker.prototype = {
        constructor: z.fn.password_checker,
        check : function(password) {
            return this.pattern.test(password);
        },
        strength : function(password) {
            var hasLower = 0,
                hasNumeric = 0,
                hasUpper = 0,
                hasSpecial = 0,
                strength = 0,
                i, asciiVal;

            // loop to traverse each and every character
            for (i = 0; i < password.length; i++) {
                asciiVal = password.charCodeAt(i);

                if ((asciiVal >= 97) && (asciiVal <= 122)) {
                    ++hasLower;
                }
                else if ((asciiVal >= 65) && (asciiVal <= 90)) {
                    ++hasUpper;
                }
                else if ((asciiVal >= 48) && (asciiVal <= 57)) {
                    ++hasNumeric;
                }
                else if ((asciiVal <= 47) || ((asciiVal >= 58) && (asciiVal <= 64)) || ((asciiVal >= 91) && (asciiVal <= 96)) || ((asciiVal >= 123) && (asciiVal <= 126))) {
                    ++hasSpecial;
                }
                // length and complexity check to determine Strength
                if (password.length < 8) {
                    strength = 1;
                }
                if (password.length >= 8) {
                    strength = 2;
                }
                if (password.length >= 14) {
                    strength = 3;
                    if ((hasUpper) && (hasSpecial) && (hasNumeric) && (hasLower)) { //MSIT recommendations check
                        strength = 4;
                    }
                }
            }

            return strength;
        },
        calc_str : function(password) {
            var str = this.strength(password);

            for(var i in this.Dom.td) {
                for(var j = 1; j <= this.strength_max; j++) {
                    removeClass(this.Dom.td[i], 'strength_' + j);
                }
                if (i <= str) {
                    addClass(this.Dom.td[i], 'strength_' + str);
                }
            }
        }
    };
    
    z.fn.inputPhone = function (initConf) {

        this.settings = {
            id: {
                input : initConf.input,
                countriesList : initConf.input + '-countriesList',
                activeCountry : initConf.input + '-activeCountry'
            },
            mask: {
                commonPhone: 'ddd?dddddddddddd'
            }
        };
        this.callback = {
            change: ((initConf.callback && typeof initConf.callback.change === 'function') ? initConf.callback.change : null)
        };
        this.build();
        this.Dom = getDom(this.settings.id);

        if (!this.Dom.input) {
            return;
        }

        this.country = {};
        this.selected = null;

        var t = this;
        $(document).click(function (event) {
            if ($(event.target).closest(t.settings.activeCountry).length === 0) {
                t.hide();
            }
        });
        $(document).on('click', '#' + t.settings.id.countriesList, function () {
            return false;
        });
        $(document).on('click', '.counrtyIN', function () {
            var country = this.getAttribute('data-country');
            t.setCountry(country);
            return false;
        });
        $(document).on('click', '#' + t.settings.id.activeCountry, function () {
            if (this.getAttribute('data-inputid') == t.settings.id.input) {
                if (t.isShow()) {
                    t.hide();
                } else {
                    t.show();
                }
            }
            return false;
        });

        if (initConf.phone_codes) {
            this.fillCountry(initConf.phone_codes);
            if (this.Dom.input.value == '') {
                this.setCountry('RU');
            } else {
                this.setPhone(this.Dom.input.value);
            }
        }
    };
    z.fn.inputPhone.prototype = {
        constructor: z.fn.inputPhone,
        build: function() {
            var t   = this;
            var el  = ge(t.settings.id.input);

            var d1 = ce('div');
            d1.id = t.settings.id.activeCountry;
            d1.setAttribute('data-inputid', t.settings.id.input);
            d1.className = 'activeCountry';
            //d1.innerHTML = '<div class="activeCountryArrow">&#9660;</div>';

            //var d3 = ce('div');
            //d3.className = 'activeCountryArrow';
            //d3.innerHTML = '&#9660;';

            var d2 = ce('div');
            d2.id = t.settings.id.countriesList;
            d2.className = 'countriesList';

            el.parentNode.appendChild(d1);
            el.parentNode.appendChild(d2);
            //el.parentNode.appendChild(d3);
        },
        setPhone: function(phone) {
            var t = this;
            for (var i in t.country) {
                if (phone.substr(0, t.country[i].code.length + 1) == '+' + t.country[i].code) {
                    t.setCountry(t.country[i].country);
                    t.Dom.input.value = phone;
                    break;
                }
            }
        },
        data: function() {
            var res = {};
            var t = this;

            if (t.country[t.selected]) {
                res = JSON.stringify(t.country[t.selected]);
                res = JSON.parse(res);
                res.code  = '+' + t.country[t.selected].code;
                res.phone = t.Dom.input.value.substr(res.code.length, t.Dom.input.value.length);
            }

            return res;
        },
        setCountry: function (country) {
            var t = this;
            var data = t.country[country];

            $.mask.definitions['9'] = '';
            $.mask.definitions['d'] = '[0-9]';
            $('#' + t.settings.id.input).mask('+' + data.code + t.settings.mask.commonPhone, {placeholder: ''});
            t.Dom.input.setAttribute('placeholder', '+' + data.code);
            t.Dom.input.value = '';
            t.Dom.activeCountry.innerHTML = country + '<div class="activeCountryArrow">&#9660;</div>';
            t.selected = country;
            t.hide();

            if (typeof t.callback.change === 'function') {
                t.callback.change(country);
            }
        },
        isShow: function () {
            var t = this,
                    r = false;
            if (t.Dom.countriesList.style.display == 'block') {
                r = true;
            }

            return r;
        },
        show: function () {
            var t = this;
            if (!t.isShow()) {
                t.Dom.countriesList.style.display = 'block';
            }
        },
        hide: function () {
            var t = this;
            if (t.isShow()) {
                t.Dom.countriesList.style.display = 'none';
            }
        },
        fillCountry: function (codesData) {
            var t = this;

            for (var i in codesData) {
                if (!codesData[i].country) {
                    continue;
                }

                t.Dom.countriesList.innerHTML +=
                        '<li data-country="' + codesData[i].country + '" class="counrtyIN">' +
                        '   <div class="itemCountry">' + codesData[i].country + '</div>' +
                        '   <div class="itemName">' + codesData[i].ru + '</div>' +
                        '   <div class="itemCode">+' + codesData[i].code + '</div>' +
                        '   <div class="clearfix"></div>' +
                        '</li>';
                t.country[codesData[i].country] = codesData[i];
            }
        }
    };

    z.fn.Countdown = function(config) {
        /**
         countdown_config = {
                seconds     : 300,
                id : {
                    countdown : 'countdown'
                },
                callback : function() {}
            }
         */
        this.Dom = getDom(config.id);
        this.config = config;
        this.timer = null;
        this.status  = true;
        this.seconds = config.seconds;
        this.callback = config.callback;

        this.start();
    };
    z.fn.Countdown.prototype = {
        constructor: z.fn.Countdown,
        countdown : function(seconds) {
            return seconds + ' ' + getLang(seconds == 1 ? 'SECONDS_OF1' : (seconds < 5 && seconds > 0 ? 'SECONDS_OF4' : 'SECONDS_OF'));
        },
        setSeconds : function(seconds) {
            seconds = parseInt(seconds);
            if (isNaN(seconds) === false && seconds > 0) {
                this.seconds = seconds;
            }
        },
        start : function() {
            this.status = true;
            this.setSeconds(this.config.seconds);

            this.tick();

            (function(al){
                al.timer = setInterval(function(){
                    if (al.status) {
                        al.tick();
                    }
                }, 1000);
            })(this);
        },
        stop : function() {
            this.status = false;
            clearInterval(this.timer);
            if (typeof this.callback == 'function') {
                this.callback();
            }
        },
        clear : function() {},
        prepare : function (x) {
            return (x / 100).toFixed(2).substr(2);
        },
        print : function(min, sec) {
            return '(' + (min < 10 ? '0' + min : min) + ':' + this.prepare(sec) + ')';
        },
        tick : function() {
            var seconds = this.seconds;

            var d = ge(this.config.id.countdown),
                w = 60,
                sec = seconds % w,
                min = (seconds - sec) / w;

            this.seconds--;
            if (seconds >= 0 && d) {
                this.print(min, sec);
                d.innerHTML = this.countdown(seconds);
            } else {
                this.stop();
            }
        }
    };

    z.fn.Header_balance = function(config) {
        this.config = {
            status : config.status,
            state  : config.state,
            id : {
                balance : 'header-balance',
                hidden  : 'header-balance-hidden',
                toggle  : 'header-balance-toggle'
            },
            class : {}
        };
        this.Dom = getDom(this.config.id);
        this.status = this.config.status;
        this.state  = this.config.state;

        this[this.state ? 'show' : 'hide']();

        z.account_balance.addContainer(this.Dom.balance, this.Dom.currency);
    };
    z.fn.Header_balance.prototype = {
        constructor : z.fn.Header_balance,
        refresh : function() {
            z.account_balance.refresh();
        },
        hide : function() {
            if (this.status == 0) { return; }
            if (this.Dom.balance) {
                addClass(this.Dom.balance, 'hidden');
                removeClass(this.Dom.hidden, 'hidden');
            }
            this.state = 0;
        },
        show : function() {
            if (this.status == 0) { return; }
            if (this.Dom.balance) {
                removeClass(this.Dom.balance, 'hidden');
                addClass(this.Dom.hidden, 'hidden');
            }
            this.state = 1;
        }
    };

    z.fn.Date_select = function(config) {
        /**
            @type {{id: {year: string, month: string, day: string}}}
            var date_selects_config = {
                id : {
                    year  : 'registration-year',
                    month : 'registration-month',
                    day   : 'registration-day'
                }
            };
         */
        this.Dom = getDom(config.id);
        this.year = {"min" : (new Date).getFullYear() - 110, "max" : (new Date).getFullYear() - 18};
        this.config = config;

        this.init();

        var b = this;
        $(document).on('change', '#' + config.id.year + ', #' + config.id.month + ', #' + config.id.day + '', function() {
            b.refresh(1);
        });
    };
    z.fn.Date_select.prototype = {
        constructor : z.fn.Date_select,
        refresh : function(add_empty) {
            if (this.Dom.year && this.Dom.month && this.Dom.day) {
                days_calc(this.Dom.year, this.Dom.month, this.Dom.day, add_empty);
            }
        },
        init : function() {
            if (this.Dom.year && this.Dom.month && this.Dom.day) {
                var index = 0, i;

                // Year
                this.Dom.year[index++] = new Option(getLang('YEAR'));
                for(i = this.year.max; i >= this.year.min; i--) {
                    this.Dom.year[index++] = new Option(i);
                }
                this.Dom.year.children[0].value = 0;
                for(i in this.Dom.year.children) {
                    if (i == 0) {continue;}
                    this.Dom.year.children[i].value = this.Dom.year.children[i].text;
                }

                // Month
                this.Dom.month[0] = new Option(getLang('MONTH'));
                for(index = 1; index <= 12; index++) {
                    this.Dom.month[index] = new Option(getLang('MONTH' + index + '_OF'));
                }
                for(i in this.Dom.month.children) {
                    this.Dom.month.children[i].value = i;
                }

                this.refresh(1);
            }
        }
    };


    z.fn.Spoiler = function() {
        this.config = {
            class : {
                header    : 'spoiler-header',
                body      : 'spoiler-body',
                ico_left  : 'spoiler-header-ico-left',
                ico_right : 'spoiler-header-ico-right',
                ico_left_r  : 's-h-i-l-r',
                ico_right_r : 's-h-i-r-r'
            },
            html : {
                arrow_down : '&#9660;',
                ico_left : {
                    hidden  : '&#9660;',
                    visible : '&#9658;'
                },
                ico_right : {
                    hidden  : '&#9660;',
                    visible : '&#9664;'
                }
            }
        };

        var s = this;
        $(document).on('click', '.spoiler-header', function() {
            if (this.nextElementSibling) {
                var state = !hasClass(this.nextElementSibling, 'hidden');
                (state ? addClass : removeClass)(this.nextElementSibling, 'hidden');
                for(var i=0; i < this.children.length; i++) {
                    if (hasClass(this.children[i], s.config.class.ico_left)) {
                        (state ? removeClass : addClass)(this.children[i], s.config.class.ico_left_r);
                    }
                    if (hasClass(this.children[i], s.config.class.ico_right)) {
                        (state ? removeClass : addClass)(this.children[i], s.config.class.ico_right_r);
                    }
                }
            }
        });
    };
    z.fn.Spoiler.prototype = {
        constructor: z.fn.Spoiler,
        add : function(id) {
            id = ge(id);
            for(var i=0; i < id.children.length; i++) {
                if (hasClass(id.children[i], this.config.class.header)) {
                    var s_h_i_l = ce('div', { className : this.config.class.ico_left});
                        //s_h_i_r = ce('div', { className : this.config.class.ico_right});

                    s_h_i_l.innerHTML = this.config.html.arrow_down;
                    //s_h_i_r.innerHTML = this.config.html.arrow_down;
                    prependElement(id.children[i], s_h_i_l);
                    //prependElement(id.children[i], s_h_i_r);
                }
                if (hasClass(id.children[i], this.config.class.body)) {
                    addClass(id.children[i], 'hidden');
                }
            }
        }
    };
    
    z.load(z, 'top_message', 'top_message');
    z.load(z, 'global_message', 'global_message');
    z.load(z, 'custom_message', 'Custom_message');
    z.load(z, 'template', 'Template');
    z.load(z, 'account', 'Account', {}, function() {});
    z.load(z, 'spoiler', 'Spoiler');
    //z.load(z, 'password_checker', 'password_checker', {pattern : z.pattern.password_lite, dom : 'cont'});

    z.a = z.account; // alias

    z.load(z, 'promo_popup', 'Promo_popup');

    z.ui.scroll('go_up_button_position', function() {
        var scrollY = scrollGetY();
        (scrollY >= 400 ? removeClass : addClass)('go-up', 'hidden');
        if (bodyNode.scrollHeight <= scrollY + 600) {
            setStyle('go-up', 'bottom', getSize(geByTag1('footer'))[1]+5);
        } else {
            setStyle('go-up', 'bottom', 5);
        }
    });

    /**
     * Header responsive toggle
     */
    $(document).on('click', '#header-menu-toggle', function(){
        toggle('header-menu-cont');
    });

    if (z.is_desktop) {
        addClass('header-site-access', 'hidden');
    }

    if (browser.mobile && (site.route != 'line/index' || site.route != 'live/index') == false) {
        if (!browser.ipad) {
            setStyle('header-menu-cont', 'display', 'none');
        }
    }

    var show_mobile_message = getCookie('show_mobile_message');
    if (browser.mobile && show_mobile_message !== '1') {
        removeClass('mobile-message', 'hidden');
    }

    $(document).on('click', '#mobile-message-close', function(){
        addClass('mobile-message', 'hidden');
        setCookie('show_mobile_message', '1', 7);
    });

    z.showNewFeaturesBox = function() {
        if (!z.template.loaded('line_new_features')) {
            z.template.add({
                id      : 'line_new_features',
                engine  : 'handlebars'
            }, function() {
                z.showNewFeaturesBox();
            });
        } else {
            z.box.show({
                title : getLang('NEW_FEATURES') + ' - ' + getLang('BM_ZENIT'),
                html : z.template.show('line_new_features'),
                width : z.mobile ? '' : 700,
                show_controls : 0,
                show_header : 1,
                show_header_close : 1,
                wrap_close : 1
            });
        }
    };
    
    z.showRules = function() {
        if (!z.template.loaded('company_rules')) {
            z.template.add({
                id      : 'company_rules',
                engine  : 'handlebars'
            }, function() {
                z.showRules();
            });
            z.static_files.add('company/company.css');
        } else {
            z.box.show({
                title : getLang('RULES') + ' - ' + getLang('BM_ZENIT'),
                html : '<div class="company-rules-box">' + z.template.show('company_rules')  + '</div>',
                width : z.mobile ? '' : bodySize[0] / 2,
                height: z.mobile ? '' : bodySize[1] / 2,
                show_controls : 1,
                show_header : 1,
                show_header_close : 1,
                wrap_close : 1,
                buttons_html : '<button id="box_close_button" class="flat_button box_close_button">' + getLang('AGREE') + '</button>'
            });
        }
    };

    z.showPrivacyPolicy = function() {
        if (!z.template.loaded('company_privacy_policy')) {
            z.template.add({
                id      : 'company_privacy_policy',
                engine  : 'handlebars'
            }, function() {
                z.showPrivacyPolicy();
            });
            z.static_files.add('company/company.css');
        } else {
            z.box.show({
                title : getLang('PRIVACY_POLICY') + ' - ' + getLang('BM_ZENIT'),
                html : '<div class="company-rules-box">' + z.template.show('company_privacy_policy')  + '</div>',
                width : z.mobile ? '' : 500,
                height: z.mobile ? '' : bodySize[1] / 2,
                show_controls : 1,
                show_header : 1,
                show_header_close : 1,
                wrap_close : 1,
                buttons_html : '<button id="box_close_button" class="flat_button box_close_button">' + getLang('AGREE') + '</button>'
            });
        }
    };

    $(document).on('click', '.show-rules-box', function(){
        z.showRules();
        return false;
    });

    $(document).on('click', '.show-privacy-policy-box', function(){
        z.showPrivacyPolicy();
        return false;
    });

})(mrgrlmrgrl, window, document);

try{z.static_files.done('mrgrlmrgrl.js');}catch(e){}
