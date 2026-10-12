#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/ece7906e9d20712017a600bb5155ce14b659f4ec8255d1ba783fe1d0811e2db5/contract';
import endContract from '../../snapshots/ece7906e9d20712017a600bb5155ce14b659f4ec8255d1ba783fe1d0811e2db5/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/f82242d208c3220e3c0fecddfa361bfdeff09811f5f64492a838e1768775ff1a/contract';
import startContract from '../../snapshots/f82242d208c3220e3c0fecddfa361bfdeff09811f5f64492a838e1768775ff1a/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, placeholder } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'tuition_invoice',
        column: col('amount', 'float8', { codecRef: { codecId: 'pg/float8@1' } }),
      }),
      this.dataTransform(endContract, 'backfill-tuition_invoice-amount', {
        check: () => placeholder('backfill-tuition_invoice-amount:check'),
        run: () => placeholder('backfill-tuition_invoice-amount:run'),
      }),
      this.setNotNull({ schema: 'public', table: 'tuition_invoice', column: 'amount' }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
