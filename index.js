const fs = require('fs');
const theme = require('./theme');
const page = require('./page')


class ConvertToTheme {

    constructor(theme, page, replaceSecondaryFont = false, themeName) {

        this.theme = theme;
        this.page = page;
        this.nonGlobals = {}
        this.replaceSecondaryFont = replaceSecondaryFont
        this.themeName = themeName
        this.changes = 0;
    }


    get conversionMap() {
        return this._generateConversionMap()
    }

    //creates map of what values to look for and what to change them to
    _generateConversionMap() {
        return {
            ...this.colors,
            ...this.fonts
        }
    }

    get colors() {
        return this._getColorMaps()
    }

    _getColorMaps() {
        let colorKeys = Object.keys(this.theme.colors)
        let colorObj = {}
        colorKeys.forEach(key => {
            let colors = Object.keys(this.theme.colors[key]).forEach((colorKey, idx) => {
                if (!colorObj.hasOwnProperty(this.theme.colors[key][colorKey])) {
                    colorObj[this.theme.colors[key][colorKey]] = `${key}${idx + 1}`.toLowerCase()
                }

            })
        })
        return colorObj
    }

    get fonts() {
        return this._getFontMap()
    }

    _getFontMap() {
        //init obj
        let fontObj = {}
        //get font family keys, reverse them so if both fonts are the same
        //it will set the value to primaryFont rather than secondary
        let fontKeys = Object.keys(this.theme.fontFamily).reverse();
        //iterate and assign theme value as lookup key and current key name
        //as value to for it to convert to
        fontKeys.forEach(key => {
            fontObj[this.theme.fontFamily[key]] = key;
        })

        return {
            ...fontObj,
            ...this.replaceSecondaryFont && {"secondaryFont": "primaryFont"}
        }
    };

    updateNonGlobals(key) {
        if (this.nonGlobals[key]) this.nonGlobals[key]++
        else this.nonGlobals[key] = 1
    }

    generateReport() {
        console.log('THEME::', this.themeName, "\n")
        console.log("\n", "Colors not in presets:", "\n")
        Object.keys(this.nonGlobals).forEach(key => {
            console.log(`color ${key} is used ${this.nonGlobals[key]} times`)
        })

        console.log("\n", "Current Color Presets", "\n")

        Object.keys(this.colors).forEach(key => {
            console.log(`${this.colors[key]}:${key}`)
        })
        console.log("\n", convertedTheme.changes + " Changes")
    }

    handleBackgroundKey(obj) {
        if(obj.background.includes("url") || obj.background.includes("gradient")  )
        if (!obj.hasOwnProperty("backgroundColor")) {
            obj.backgroundColor = obj.background;
        }
        delete obj.background;
        return obj
    }

    checkForGlobalValues(obj) {

        if (!obj) return

        if (Array.isArray(obj)) {
            return obj.forEach(o => this.checkForGlobalValues(o))
        }

        let keys = Object.keys(obj);

        var deleteKeys = ['alternate', 'backgroundColors', 'button1a', 'button2a', 'button3a', 'textColors']

        keys.forEach(key => {
            if (deleteKeys.indexOf(key) != -1) {
                this.changes ++
                return delete obj[key];
            }

            if (key === "background") {
                this.changes ++
                obj = this.handleBackgroundKey(obj)
            }

            if ((key === "fontFamily" && typeof obj[key] === "object") || key === "fonts" || key === "colors") return;
            if (typeof obj[key] === "object") return this.checkForGlobalValues(obj[key])

            let value = obj[key];

            if (`${value}`.includes("#")) value = value.toLowerCase();

            if (this.conversionMap[value]) {
                this.changes ++
                obj[key] = this.conversionMap[obj[key]]
                return
            }

            if (`${obj[key]}`.includes('#')) this.updateNonGlobals(obj[key])
        })

        return obj

    }

    searchPageForGlobals() {

        
        let obj = this.page.map(obj => this.checkForGlobalValues(obj));

        fs.writeFileSync('new.json', JSON.stringify(obj))

    }


}

const convertedTheme = new ConvertToTheme(theme, page, true, "Vitamin D")
convertedTheme.searchPageForGlobals()
convertedTheme.generateReport()



// const stargazerTheme = new ConvertToTheme(stargazer, [{...stargazer}], false, "Stargazer")
// stargazerTheme.searchPageForGlobals()
// stargazerTheme.generateNonGlobalsReport()

// const smartCookieTheme = new ConvertToTheme(smartCookie, [{...smartCookie}, false, "Smart Cookie"])
// smartCookieTheme.searchPageForGlobals()
// smartCookieTheme.generateNonGlobalsReport()

// const wandererTheme = new ConvertToTheme(wanderer, [{...wanderer}], false, "Wanderer")
// wandererTheme.searchPageForGlobals()
// wandererTheme.generateNonGlobalsReport()

// const vitaminDTheme = new ConvertToTheme(vitaminD, [{...vitaminD}], false, "Vitamin D")
// vitaminDTheme.searchPageForGlobals()
// vitaminDTheme.generateNonGlobalsReport()
