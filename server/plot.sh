#!/bin/bash

FILE=$1
DEGREE=$2

SZFL=`cat $FILE | wc -l`

OUTFLE="set term svg; set output '$FILE.svg'; "

RES=`./main $SZFL $DEGREE --gnuplot < "$FILE"`
RES=`echo $RES | tail -n1`

NEXT="; plot '$FILE', f(x)"

echo "$OUTFLE$RES$NEXT" | gnuplot