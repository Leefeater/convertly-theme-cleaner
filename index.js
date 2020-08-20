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
    //function for getter colors
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
    //function for getter fonts
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
    //adds to array of non-globals
    updateNonGlobals(key) {
        if (this.nonGlobals[key]) this.nonGlobals[key]++
        else this.nonGlobals[key] = 1
    }

    generateReport() {
        //theme name
        console.log('THEME::', this.themeName, "\n")
        //log the colors that aren't in the global color scheme
        console.log("\n", "Colors not in presets:", "\n")
        Object.keys(this.nonGlobals).forEach(key => {
            console.log(`color ${key} is used ${this.nonGlobals[key]} times`)
        })
        //log the global color scheme
        console.log("\n", "Current Color Presets", "\n")

        Object.keys(this.colors).forEach(key => {
            console.log(`${this.colors[key]}:${key}`)
        })

        //log number of changes
        console.log("\n", convertedTheme.changes + " Changes")
    }
    //checks if background key should be "backgroundColor" and converts it
    handleBackgroundKey(obj) {
        //if img or gradient, re skip it
        if(obj.background.includes("url") || obj.background.includes("gradient")  ) return obj;
        //if there isn't a background color already assigned we assign it to the background color
        if (!obj.hasOwnProperty("backgroundColor")) {
            obj.backgroundColor = obj.background;
        }
        //delete background key
        delete obj.background;
        //return it
        return obj
    }
    //iterates through keys and converts static values into global variables
    checkForGlobalValues(obj) {

        if (!obj) return

        if (Array.isArray(obj)) {
            return obj.forEach(o => this.checkForGlobalValues(o))
        }

        let keys = Object.keys(obj);

        //keys to delete
        const deleteKeys = ['alternate', 'backgroundColors', 'button1a', 'button2a', 'button3a', 'textColors']
        //keys to ignore
        const skipKeys = ['fonts', 'colors'];

        keys.forEach(key => {
            //find keys to remove and remove them
            if (deleteKeys.indexOf(key) != -1) {
                this.changes ++
                return delete obj[key];
            }
            //if background is key, run the background handler
            //this will convert background to backgroundColor if its a color
            if (key === "background") {
                this.changes ++
                obj = this.handleBackgroundKey(obj)
            }
            //skip these keys as they are meta data
            if ((key === "fontFamily" && typeof obj[key] === "object") || skipKeys.indexOf(key) != -1) return;
            //if its an object re recurse
            if (typeof obj[key] === "object") return this.checkForGlobalValues(obj[key])
            //get value
            let value = obj[key];
            //convert to lower case if its a hex code
            if (`${value}`.includes("#")) value = value.toLowerCase();
            //check if its in the conversions map anc convert it
            if (this.conversionMap[value]) {
                this.changes ++
                obj[key] = this.conversionMap[obj[key]]
                return
            }
            //if its a color but not in the globals, we add it to the report
            if (`${obj[key]}`.includes('#')) this.updateNonGlobals(obj[key])
        });

        //return it
        return obj

    }

    searchPageForGlobals() {

        //run the check and conversion
        let obj = this.page.map(obj => this.checkForGlobalValues(obj));
        //write it to the fs
        fs.writeFileSync('new.json', JSON.stringify(obj))

    }


}

const convertedTheme = new ConvertToTheme(theme, page, true, "Vitamin D")
convertedTheme.searchPageForGlobals();
convertedTheme.generateReport();

