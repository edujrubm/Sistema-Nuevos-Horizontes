# Ficha inicial

La ficha inicial es la entrada del proceso de admisión. Su creación genera en
una transacción la beneficiaria, el expediente y el borrador. Las ocho páginas
visibles guardan progresivamente los 19 apartados institucionales.

Las hijas e hijos se originan al guardar la página `familia`; el mismo `PATCH`
crea o actualiza sus registros estructurados dentro de la transacción de la
página. No existe una operación independiente para registrar hijos desde la
ficha.
