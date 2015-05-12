#include <gsl/gsl_math.h>
#include <math.h>
#include <stdio.h>
#include <stdlib.h>
#include <gsl/gsl_multifit.h>


double* res;

void print_usage(char* progname) {
    printf("Usage: %s data_size [poly_n=1] --gnuplot \n ", progname);
}

double polynomialfit(int obs, int degree, double *dx, double *dy, double *store) {
    gsl_multifit_linear_workspace *ws;
    gsl_matrix *cov, *X;
    gsl_vector *y, *c;
    double chisq;

    int i, j;

    X = gsl_matrix_alloc(obs, degree);
    y = gsl_vector_alloc(obs);
    c = gsl_vector_alloc(degree);
    cov = gsl_matrix_alloc(degree, degree);

    for(i=0; i < obs; i++) {
        gsl_matrix_set(X, i, 0, 1.0);
        for(j=0; j < degree; j++) {
            gsl_matrix_set(X, i, j, pow(dx[i], j));
        }
        gsl_vector_set(y, i, dy[i]);
    }

    ws = gsl_multifit_linear_alloc(obs, degree);
    gsl_multifit_linear(X, y, c, cov, &chisq, ws);

    for(i=0; i < degree; i++) {
        store[i] = gsl_vector_get(c, i);
    }

    gsl_multifit_linear_free(ws);
    gsl_matrix_free(X);
    gsl_matrix_free(cov);
    gsl_vector_free(y);
    gsl_vector_free(c);
    return chisq; // return error
}

int main(int argc, char *argv[]) {
    if(argc < 3)
        print_usage(argv[0]);
    int data_n = strtol(argv[1], NULL, 10);
    int poly_n = strtol(argv[2], NULL, 10);

    int gnuplot_format = 0;

    if(argc > 3 && strcmp(argv[3], "--gnuplot") == 0) {
        gnuplot_format = 1;
    }

    poly_n += 1;


    double* dx = malloc(data_n * sizeof(double));
    double* dy = malloc(data_n * sizeof(double));
    double* res = malloc(poly_n * sizeof(double));


    for(int i = 0; data_n > i; i++) {
        scanf("%lf %lf", &dx[i], &dy[i]);
    }

    //** SOLVE
    double err = polynomialfit(data_n, poly_n, dx, dy, res);


    
    if(!gnuplot_format) {
        printf("E: %.10lf\n", err);
        for(int i = 0; poly_n > i; i++) {
            printf("%.30lf ", res[i]);
        }
        printf("\n");
    } else {
        printf("f(x) = ");
        int i = 0;
        for(i = 0; poly_n - 1 > i; i++) {
            printf("%.30lf ", res[i]);
            for(int j = 0; j < i; j++) {
                printf("*x");
            }
            printf(" + ");
        }
        if(i < poly_n) {
            printf("%.30lf ", res[i]);
            for(int j = 0; j < i; j++) {
                printf("*x");
            }
        }
        printf("\n");
    }

    free(dx);
    free(dy);
    free(res);

    return 0;
}