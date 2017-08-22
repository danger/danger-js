#!/usr/bin/env ruby

puts 'Hello world'

str = STDIN.tty? ? 'Cannot read from STDIN' : $stdin.read
puts str
