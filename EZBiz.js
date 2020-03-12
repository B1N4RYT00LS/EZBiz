// Github:  <NONE>
// By:      K0D3R
// Contact: https://app.roll20.net/users/2234901/k0d3r
// Macro:   !biz ?{PROPERTY|Abbey,20|Farm,0.5|Guildhall,5|Inn (Rural),10|Inn (Town),5|Keep or Small Castle,100|Logde (Hunting),0.5|Noble Estate,10|Outpost or Fort,50|Palace or Large Castle,400|Shop,2|Temple (Large),25|Temple (Small),1|Tower (Fortified),25|Trading Post,10} ?{WEEKS WORKED}


var EZBiz = EZBiz || (function () {
    'use strict';

    const version = '0.1.1',
          lastUpdate = 1584012898,
          schemaVersion = 0.1;
    
    let DEBUG = true, 
        DAYS_IN_WORKWEEK = 10;

    const _h = {
        outer: (...o) => `<div style="border: 1px solid black; background-color: white; padding: 3px 3px;">${o.join(' ')}</div>`,
        title: (t, v) => `<div style="font-weight: bold; border-bottom: 1px solid black;font-size: 130%;">${t} v${v}</div>`,
        subhead: (...o) => `<b>${o.join(' ')}</b>`,
        minorhead: (...o) => `<u>${o.join(' ')}</u>`,
        optional: (...o) => `${ch('[')}${o.join(` ${ch('|')} `)}${ch(']')}`,
        required: (...o) => `${ch('<')}${o.join(` ${ch('|')} `)}${ch('>')}`,
        header: (...o) => `<div style="padding-left:10px;margin-bottom:3px;">${o.join(' ')}</div>`,
        section: (s, ...o) => `${_h.subhead(s)}${_h.inset(...o)}`,
        paragraph: (...o) => `<p>${o.join(' ')}</p>`,
        items: (o) => `<li>${o.join('</li><li>')}</li>`,
        ol: (...o) => `<ol>${_h.items(o)}</ol>`,
        ul: (...o) => `<ul>${_h.items(o)}</ul>`,
        grid: (...o) => `<div style="padding: 12px 0;">${o.join('')}<div style="clear:both;"></div></div>`,
        cell: (o) =>  `<div style="width: 130px; padding: 0 3px; float: left;">${o}</div>`,
        inset: (...o) => `<div style="padding-left: 10px;padding-right:20px">${o.join(' ')}</div>`,
        pre: (...o) =>`<div style="border:1px solid #e1e1e8;border-radius:4px;padding:8.5px;margin-bottom:9px;font-size:12px;white-space:normal;word-break:normal;word-wrap:normal;background-color:#f7f7f9;font-family:monospace;overflow:auto;">${o.join(' ')}</div>`,
        preformatted: (...o) =>_h.pre(o.join('<br>').replace(/\s/g, ch(' '))),
        code: (...o) => `<code>${o.join(' ')}</code>`,
        attr: {
            bare: (o) =>`${ch('@')}${ch('{')}${o}${ch('}')}`,
            selected: (o) =>`${ch('@')}${ch('{')}selected${ch('|')}${o}${ch('}')}`,
            target: (o) =>`${ch('@')}${ch('{')}target${ch('|')}${o}${ch('}')}`,
            char: (o, c) =>`${ch('@')}${ch('{')}${c || 'CHARACTER NAME'}${ch('|')}${o}${ch('}')}`
        },
        bold: (...o) => `<b>${o.join(' ')}</b>`,
        italic: (...o) => `<i>${o.join(' ')}</i>`,
        font: {
            command: (...o) =>`<b><span style="font-family:serif;">${o.join(' ')}</span></b>`
        }
    };

    const ch = (c) => {
        const entities = {
            '<': 'lt',
            '>': 'gt',
            "'": '#39',
            '@': '#64',
            '{': '#123',
            '|': '#124',
            '}': '#125',
            '[': '#91',
            ']': '#93',
            '"': 'quot',
            '-': 'mdash',
            ' ': 'nbsp'
        };

        if (_.has(entities, c)) {
            return ('&' + entities[c] + ';');
        }
        return '';
    };

    const showHelp = (playerid) => {
        let who = (getObj('player', playerid) || { get: () =>'API' }).get('_displayname');
        
        sendChat("", "/w " + who + " " + 
            _h.outer(
                _h.title('EZBiz', version),
                _h.header(
                    _h.paragraph("This API uses the rules from the 5e DMG (pg.126) 'Running a Business' and 'Recurring Expenses'")
                ),
                _h.subhead('Commands'),
                _h.inset(
                    _h.font.command(
                        `!biz `,
                        _h.optional(
                            `help`,
                            `set days`,
                            `set debug`,
                            `work`
                        )
                    ),
                    _h.ul(
                        `${_h.bold('help')} -- Shows the help screen`,
                        `${_h.bold('set days (AMOUNT)')} -- Sets the amount of days in a workweek. Default is 10. `,
                        `${_h.bold('set debug (TRUE or FALSE)')} -- Activates debug mode for verbose logging into the API sandbox.`,
                        `${_h.bold('work (UPKEEP) (WEEKS)')} -- Calculate results according to the upkeep cost per day in gold and how many weeks worked.`
                    )
                ),
                _h.paragraph(`Work example for an Abbey (20g) working for one week.`),
                _h.inset(
                    _h.preformatted(
                        '!biz work 20 1'
                        )
                )
            )
        );
    }

    const showResults = (upkeep, weeks) => {
        var total = GetResults(upkeep, weeks)
        sendChat('', ' ' + 
            _h.outer(
                _h.title('EZBiz', version),
                _h.subhead('Results'),
                    _h.ul(`${_h.bold('Upkeep: ')}` + upkeep + ' per day.'),
                    _h.ul(`${_h.bold('Worked: ')}` + weeks * DAYS_IN_WORKWEEK + ' days.'),
                    _h.ul(`${_h.bold('Earned: ')}` + total + ' gold.')
                )
            )
    }

    var handleInput = (msg) => {

        if (msg.type !== "api") {
            return;
        }

        var args = msg.content.split(' ');
        switch (args[0]) {
            case "!biz":
                if (args.includes('help')) {
                    showHelp(msg.playerid);
                }
                if (args.includes('set')) {
                    switch (args[2]) {
                        case 'days':
                            if (Number.isInteger(args[3])) {
                                DAYS_IN_WORKWEEK = args[3];
                            }
                            break;

                        case 'debug':
                            if (DEBUG || args.includes('false')) DEBUG = false;
                            else DEBUG = true;
                            break;
                    }
                }
                if (args.includes('work')) {
                    if (Number.isInteger(parseInt(args[2])) && Number.isInteger(parseInt(args[3]))) {
                        showResults(args[2], args[3]);
                    }
                }

                break;
        }
    };

    var GetResults = (upkeep, weeks) => {
        var results = 0; var roll = new Array(4);
        var days = DAYS_IN_WORKWEEK;

        if (DEBUG) { log("-=> ############################# "); }
        if (DEBUG) { log("-=> EZBiz DAILY COST: " + upkeep); }
        if (DEBUG) { log("-=> EZBiz DAYS WORKED: " + (weeks * days)); }

        for (let i = 0; i < weeks; i++) {
            roll[0] = randomInteger(100);

            if (DEBUG) { log("-=> EZBiz ROLLED (1xD100): " + roll[0]); }

            if (roll[0] > 0 && roll[0] <= 20) {
                results += ((upkeep * days) * -1.5);
                if (DEBUG) { log("-=> EZBiz EXPENSE: " + ((upkeep * days) * -1.5)); }
            }
            else if (roll[0] > 20 && roll[0] <= 30) {
                results += ((upkeep * days) * -1);
                if (DEBUG) { log("-=> EZBiz EXPENSE: " + ((upkeep * days) * -1)); }
            }
            else if (roll[0] > 30 && roll[0] <= 40) {
                results += ((upkeep & days) * -0.5);
                if (DEBUG) { log("-=> EZBiz EXPENSE: " + ((upkeep * days) * -0.5)); }
            }
            else if (roll[0] > 40 && roll[0] <= 60) {
                results += 0;
                if (DEBUG) { log("-=> EZBiz EXPENSE: 0"); }
            }
            else if (roll[0] > 60 && roll[0] <= 80) {
                roll[1] = randomInteger(6);
                results += (roll[1] * 5) * days;
                if (DEBUG) { log("-=> EZBiz ROLLED (1xD6): " + roll[1]); }
            }
            else if (roll[0] > 80 && roll[0] <= 90) {
                roll[1] = randomInteger(8);
                roll[2] = randomInteger(8);
                results += ((roll[1] + roll[2]) * 5) * days;
                if (DEBUG) { log("-=> EZBiz ROLLED (2xD8): " + roll[1] + " " + roll[2]); }
            }
            else if (roll[0] > 90 && roll[0] <= 100) {
                roll[1] = randomInteger(10);
                roll[2] = randomInteger(10);
                roll[3] = randomInteger(10);
                results += ((roll[1] + roll[2] + roll[3]) * 5) * days;
                if (DEBUG) { log("-=> EZBiz ROLLED (3xD10): " + roll[1] + " " + roll[2] + " " + roll[3]); }
            }
        }

        if (DEBUG) { log("-=> EZBiz TOTAL: " + results); }

        return results;
    };

    var checkInstall = () => {
        log("-=> EZBiz v" + version + " [" + (new Date(lastUpdate * 1000)) + "] <=-");

        if (!_.has(state, 'EZBiz') || state.EZBiz.version !== schemaVersion) {
            log('-=> Updating Schema to v' + schemaVersion + '<=-');
            state.EZBiz = {
                version: schemaVersion,
                config: {}
            }
        };
    };

    var registerEventHandlers = () => {
        on('chat:message', handleInput);
    };

    return {
        CheckInstall: checkInstall,
        RegisterEventHandlers: registerEventHandlers
    };
})();

on('ready', () => {
    'use strict';

    EZBiz.CheckInstall();
    EZBiz.RegisterEventHandlers();
});