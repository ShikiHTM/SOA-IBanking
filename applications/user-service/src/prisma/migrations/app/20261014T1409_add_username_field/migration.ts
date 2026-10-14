#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/3df7441c1f7c09f7287374a0764a99b20f93fde7cee1705f4ac37c1b74cb3c00/contract';
import startContract from '../../snapshots/3df7441c1f7c09f7287374a0764a99b20f93fde7cee1705f4ac37c1b74cb3c00/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/ec721e290fe1a3d4f59d3ff5edf987285feb468d5979ac72458fc0c9877418ba/contract';
import endContract from '../../snapshots/ec721e290fe1a3d4f59d3ff5edf987285feb468d5979ac72458fc0c9877418ba/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.dropTable({ schema: 'public', table: 'User' }),
      this.createTable({
        schema: 'public',
        table: 'user',
        columns: [
          col('email', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('password', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('phone_number', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('username', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
