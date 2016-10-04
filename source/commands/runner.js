#! /usr/bin/env node
// @flow

// This is needed so that other files can use async funcs
import "babel-polyfill"

import app from "./app"
app.parse(process.argv)
