/* lzo-raw-codec.c -- very simple compression / decompression
   wrapper for minilzo

  This library is free software; you can redistribute it and/or
  modify it under the terms of the GNU General Public License as
  published by the Free Software Foundation; either version 2 of
  the License, or (at your option) any later version.

  You should have received a copy of the GNU General Public License
  along with the minilzo-js library; see the file COPYING.
  If not, write to the Free Software Foundation, Inc.,
  51 Franklin Street, Fifth Floor, Boston, MA 02110-1301, USA.
 */

/*
  original minilzo.c by:
  Markus F.X.J. Oberhumer
  <markus@oberhumer.com>
  http://www.oberhumer.com/opensource/lzo/
 */

/*
  NOTE:
    the full LZO package can be found at
    http://www.oberhumer.com/opensource/lzo/
 */


#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/stat.h>

#include "minilzo.h"


#define IN_LEN      (128*1024ul)
#define OUT_LEN     (IN_LEN + IN_LEN / 16 + 64 + 3)

static unsigned char __LZO_MMODEL out [ OUT_LEN ];

#define HEAP_ALLOC(var,size) \
    lzo_align_t __LZO_MMODEL var [ ((size) + (sizeof(lzo_align_t) - 1)) / sizeof(lzo_align_t) ]

static HEAP_ALLOC(wrkmem, LZO1X_1_MEM_COMPRESS);


/*************************************************************************
//
**************************************************************************/

int main(int argc, char *argv[])
{
    int r;
    lzo_uint in_len;
    lzo_uint out_len;

    if (argc != 4 || (strncmp(argv[1], "-c", 2) != 0 && strncmp(argv[1], "-d", 2) != 0)) {
      printf("Usage: lzo-raw-codec [-c|-d] <input> <output>\n");
      return 1;
    }

    char *inputFilename = argv[2];
    char *outputFilename = argv[3];

    FILE *inFile = fopen(inputFilename, "r");

    fseek(inFile, 0, SEEK_END);
    long fsize = ftell(inFile);
    fseek(inFile, 0, SEEK_SET);

    unsigned char *string = malloc(fsize + 1);
    fread(string, fsize, 1, inFile);
    fclose(inFile);


    printf("\nLZO real-time data compression library (v%s, %s).\n",
           lzo_version_string(), lzo_version_date());
    printf("Copyright (C) 1996-2015 Markus Franz Xaver Johannes Oberhumer\nAll Rights Reserved.\n\n");


/*
 * Step 1: initialize the LZO library
 */
    if (lzo_init() != LZO_E_OK)
    {
        printf("internal error - lzo_init() failed !!!\n");
        printf("(this usually indicates a compiler bug - try recompiling\nwithout optimizations, and enable '-DLZO_DEBUG' for diagnostics)\n");
        return 3;
    }

    in_len = fsize;

    if(strncmp(argv[1], "-c", 2) == 0) {

      out_len = (in_len + in_len / 16 + 64 + 3);

      r = lzo1x_1_compress(string,in_len,out,&out_len,wrkmem);
      if (r == LZO_E_OK)
          printf("compressed %lu bytes into %lu bytes\n",
              (unsigned long) in_len, (unsigned long) out_len);
      else
      {
          /* this should NEVER happen */
          printf("internal error - compression failed: %d\n", r);
          return 2;
      }
      /* check for an incompressible block */
      if (out_len >= in_len)
      {
          printf("This block contains incompressible data.\n");
          return 0;
      }

    } else {

      r = lzo1x_decompress(string,in_len,out,&out_len,NULL);

      if (r == LZO_E_OK)
          printf("decompressed %lu bytes back into %lu bytes\n",
              (unsigned long) in_len, (unsigned long) out_len);
      else
      {
          /* this should NEVER happen */
          printf("internal error - decompression failed: %d\n", r);
          return 1;
      }
    }

    FILE *outFile = fopen(outputFilename, "wb");
    fwrite(out, 1, out_len, outFile);
    fclose(outFile);

    return 0;
}


/* vim:set ts=4 sw=4 et: */
