#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/f82242d208c3220e3c0fecddfa361bfdeff09811f5f64492a838e1768775ff1a/contract';
import endContract from '../../snapshots/f82242d208c3220e3c0fecddfa361bfdeff09811f5f64492a838e1768775ff1a/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  checkExpression,
  col,
  lit,
  primaryKey,
} from '@prisma/orm-postgres/migration';

export default class M extends Migration<never, End> {
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createSchema({ schema: 'public' }),
      this.createTable({
        schema: 'public',
        table: 'student',
        columns: [
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'tuition_invoice',
        columns: [
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('status', 'text', {
            notNull: true,
            default: lit('pending'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('student_id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'tuition_invoice_status_check_f5d9a761',
            `"status" IN ('pending', 'overdue', 'paid')`,
          ),
        ],
      }),
      this.createIndex({
        schema: 'public',
        table: 'tuition_invoice',
        index: 'tuition_invoice_student_id_idx_dcf4f5c9',
        columns: ['student_id'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'tuition_invoice',
        foreignKey: {
          name: 'tuition_invoice_student_id_fkey',
          columns: ['student_id'],
          references: { schema: 'public', table: 'student', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
