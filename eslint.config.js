module.exports = [
    {
        languageOptions: {
            ecmaVersion: 2020,  // Updated to support for...of loops and other modern syntax
            sourceType: "script",
            globals: {
                // Browser globals
                window: "readonly",
                document: "readonly",
                console: "readonly",
                setInterval: "readonly",
                clearInterval: "readonly",

                // jQuery
                $: "readonly",
                jQuery: "readonly",

                // Game constants
                BOXSIDE: "readonly",
                CWIDTH: "readonly",
                CHEIGHT: "readonly",
                NUMCOL: "readonly",
                NUMROW: "readonly",
                INVWIDTH: "readonly",
                INVHEIGHT: "readonly",
                INVBOXSIDE: "readonly",
                INVNUMCOL: "readonly",
                INVNUMROW: "readonly",
                HORIZONTALRADIUS: "readonly",
                VERTICALRADIUS: "readonly",

                // Game variables
                currPlayer: "writable",
                playerList: "writable",
                locationMap: "writable",
                ovlycxt: "writable",
                pcxt: "writable",
                itemJson: "writable",
                buildAnimationId: "writable",
                currentSelectedSlot: "writable",
                inventoryInitialized: "writable",
                pendingInventoryUpdates: "writable",

                // Game functions
                drawPlayerNames: "readonly",
                getItemIcon: "readonly",
                getItemObj: "readonly",
                projectSquare: "readonly",
                emitItemSwap: "readonly",

                // Socket.io
                io: "readonly",
                socket: "readonly"
            }
        },
        rules: {
            "no-console": "off",
        }
    }
];