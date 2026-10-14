#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/4ed37f51725d73ee5783a7ec09d8e781c42bc4c439e5413a1c42ffd83d2911ec/contract';
import endContract from '../../snapshots/4ed37f51725d73ee5783a7ec09d8e781c42bc4c439e5413a1c42ffd83d2911ec/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/ec721e290fe1a3d4f59d3ff5edf987285feb468d5979ac72458fc0c9877418ba/contract';
import startContract from '../../snapshots/ec721e290fe1a3d4f59d3ff5edf987285feb468d5979ac72458fc0c9877418ba/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, placeholder } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'user',
        column: col('created_at', 'timestamptz', {
          notNull: true,
          default: fn('now()'),
          codecRef: { codecId: 'pg/timestamptz-temporal@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'user',
        column: col('updated_at', 'timestamptz', {
          codecRef: { codecId: 'pg/timestamptz-temporal@1' },
        }),
      }),
      this.dataTransform(endContract, 'backfill-user-updated_at', {
        check: () => placeholder('backfill-user-updated_at:check'),
        run: () => placeholder('backfill-user-updated_at:run'),
      }),
      this.setNotNull({ schema: 'public', table: 'user', column: 'updated_at' }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
