#!/bin/bash

while true; do (cat response.http) | nc -lp 8080; done
