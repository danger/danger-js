#!/usr/bin/env ruby

str = STDIN.tty? ? "Cannot read from STDIN" : $stdin.read
exit(1) unless str

# Have a dumb fake response
require "json"
puts "Hello from ruby!"
results = { fails: [], warnings: [], messages: [], markdowns: [] }.to_json

STDOUT.write(results)
