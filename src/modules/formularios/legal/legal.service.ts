import { Injectable } from "@nestjs/common";
import {
  LegalFormType,
  LegalRepository,
} from "./repositories/legal.repository";

/** Consultas propias de Legal; las escrituras se migran en una entrega separada. */
@Injectable()
export class LegalService {
  constructor(private readonly repository: LegalRepository) {}

  reference(id: string) {
    return this.repository.reference(id);
  }

  list(
    beneficiaryId: string,
    type: LegalFormType,
    page: number,
    limit: number,
  ) {
    return this.repository.list(beneficiaryId, type, page, limit);
  }
}
