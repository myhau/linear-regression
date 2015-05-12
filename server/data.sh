#!/bin/bash

FILE=$1
DEGREE=$2

SZFL=`cat $FILE | wc -l`


RES=`./main $SZFL $DEGREE < "$FILE"`


echo "$RES"