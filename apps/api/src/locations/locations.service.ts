import { Injectable } from '@nestjs/common';
import catalog from './divipola.json' with { type: 'json' };

export interface Municipality {
  departmentCode: string;
  department: string;
  code: string;
  name: string;
}
const municipalities: readonly Municipality[] = (
  catalog as {
    cod_dpto: string;
    dpto: string;
    cod_mpio: string;
    nom_mpio: string;
  }[]
).map((entry) => ({
  departmentCode: entry.cod_dpto,
  department: entry.dpto,
  code: entry.cod_mpio,
  name: entry.nom_mpio,
}));
@Injectable()
export class LocationsService {
  departments() {
    return [
      ...new Map(
        municipalities.map(({ departmentCode, department }) => [
          departmentCode,
          { code: departmentCode, name: department },
        ]),
      ).values(),
    ].sort((a, b) => a.name.localeCompare(b.name, 'es'));
  }
  municipalities(departmentCode: string) {
    return municipalities
      .filter((item) => item.departmentCode === departmentCode)
      .map(({ code, name }) => ({ code, name }))
      .sort((a, b) => a.name.localeCompare(b.name, 'es'));
  }
  municipality(code: string) {
    return municipalities.find((item) => item.code === code);
  }
}
