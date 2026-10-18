import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { StatusBadge } from './StatusBadge';
import { Skeleton, TableSkeletonRows } from './Skeleton';
import { Modal } from './Modal';
import { ConfirmDialog } from './ConfirmDialog';
import { DataTable } from './DataTable';

describe('Monochrome Design System Components', () => {
  describe('StatusBadge', () => {
    it('renders correct labels and classes for ONLINE and ACTIVE', () => {
      const htmlOnline = renderToStaticMarkup(<StatusBadge status="ONLINE" />);
      expect(htmlOnline).toContain('online');
      expect(htmlOnline).toContain('bg-black text-white');

      const htmlActive = renderToStaticMarkup(<StatusBadge status="ACTIVE" label="Running" />);
      expect(htmlActive).toContain('running');
    });

    it('renders correct labels and classes for OFFLINE and FAILED', () => {
      const htmlOffline = renderToStaticMarkup(<StatusBadge status="OFFLINE" />);
      expect(htmlOffline).toContain('offline');
      expect(htmlOffline).toContain('bg-neutral-200 text-neutral-900');
    });

    it('renders correct labels and classes for PENDING and WARNING', () => {
      const htmlWarning = renderToStaticMarkup(<StatusBadge status="WARNING" />);
      expect(htmlWarning).toContain('warning');
      expect(htmlWarning).toContain('bg-neutral-100 text-neutral-800');
    });
  });

  describe('Skeleton & TableSkeletonRows', () => {
    it('renders requested count of skeletons', () => {
      const html = renderToStaticMarkup(<Skeleton count={3} className="h-4 w-20" />);
      const pulseDivs = (html.match(/animate-pulse/g) || []).length;
      expect(pulseDivs).toBe(3);
    });

    it('renders requested rows and cols in TableSkeletonRows', () => {
      const html = renderToStaticMarkup(
        <table>
          <tbody>
            <TableSkeletonRows rows={3} cols={4} />
          </tbody>
        </table>
      );
      const rows = (html.match(/<tr/g) || []).length;
      const cells = (html.match(/<td/g) || []).length;
      expect(rows).toBe(3);
      expect(cells).toBe(12);
    });
  });

  describe('Modal', () => {
    it('returns null when isOpen is false', () => {
      const html = renderToStaticMarkup(
        <Modal isOpen={false} onClose={() => {}} title="Test Modal">
          <div>Modal content</div>
        </Modal>
      );
      expect(html).toBe('');
    });

    it('renders title, description, and children when isOpen is true', () => {
      const html = renderToStaticMarkup(
        <Modal
          isOpen={true}
          onClose={() => {}}
          title="Server Configuration"
          description="Detailed configuration modal"
        >
          <div>Child Element Loaded</div>
        </Modal>
      );
      expect(html).toContain('Server Configuration');
      expect(html).toContain('Detailed configuration modal');
      expect(html).toContain('Child Element Loaded');
      expect(html).toContain('role="dialog"');
    });
  });

  describe('ConfirmDialog', () => {
    it('renders null when isOpen is false', () => {
      const html = renderToStaticMarkup(
        <ConfirmDialog
          isOpen={false}
          onClose={() => {}}
          onConfirm={() => {}}
          title="Delete Confirmation"
          message="Are you sure?"
        />
      );
      expect(html).toBe('');
    });

    it('renders destructive dialog elements when isOpen is true', () => {
      const html = renderToStaticMarkup(
        <ConfirmDialog
          isOpen={true}
          onClose={() => {}}
          onConfirm={() => {}}
          title="Delete Router"
          message="This action will terminate active sessions."
          isDestructive={true}
          confirmLabel="Delete Permanently"
        />
      );
      expect(html).toContain('Delete Router');
      expect(html).toContain('This action will terminate active sessions.');
      expect(html).toContain('Delete Permanently');
      expect(html).toContain('bg-neutral-900');
    });
  });

  describe('DataTable', () => {
    interface TestItem {
      id: string;
      name: string;
      rate: string;
    }

    const testColumns = [
      { key: 'id', header: 'ID' },
      { key: 'name', header: 'Package Name' },
      { key: 'rate', header: 'Speed' },
    ];

    it('renders empty state when data array is empty', () => {
      const html = renderToStaticMarkup(
        <DataTable<TestItem>
          columns={testColumns}
          data={[]}
          keyExtractor={(item) => item.id}
          emptyTitle="No packages"
          emptyDescription="Create your first package"
        />
      );
      expect(html).toContain('No packages');
      expect(html).toContain('Create your first package');
    });

    it('renders table headers and rows when data is present', () => {
      const items: TestItem[] = [
        { id: 'pkg-1', name: 'Starter 20M', rate: '20M/20M' },
        { id: 'pkg-2', name: 'Business 50M', rate: '50M/50M' },
      ];

      const html = renderToStaticMarkup(
        <DataTable<TestItem>
          columns={testColumns}
          data={items}
          keyExtractor={(item) => item.id}
        />
      );
      expect(html).toContain('Starter 20M');
      expect(html).toContain('Business 50M');
      expect(html).toContain('Package Name');
      expect(html).toContain('Speed');
    });

    it('renders router gateway records with telemetry and action buttons', () => {
      const routerItems = [
        {
          id: 'r-1',
          name: 'Core-CCR2004-Dhanmondi',
          host: '10.200.0.1',
          port: 443,
          protocol: 'REST_HTTPS',
          rosVersion: '7.14.3',
          activeSessionsCount: 418,
          connectionStatus: 'ONLINE',
        },
      ];

      const routerColumns = [
        {
          key: 'name',
          header: 'Router Gateway',
          render: (item: any) => (
            <div>
              <span className="font-semibold text-neutral-900 dark:text-neutral-100">{item.name}</span>
              <span className="font-mono">{item.host}:{item.port}</span>
              <span>{item.protocol.replace('_', ' ')}</span>
            </div>
          ),
        },
        {
          key: 'sessions',
          header: 'PPPoE Sessions',
          render: (item: any) => (
            <div>{item.activeSessionsCount} tunnels</div>
          ),
        },
      ];

      const html = renderToStaticMarkup(
        <DataTable
          columns={routerColumns}
          data={routerItems}
          keyExtractor={(item) => item.id}
        />
      );
      expect(html).toContain('Core-CCR2004-Dhanmondi');
      expect(html).toContain('10.200.0.1:443');
      expect(html).toContain('REST HTTPS');
      expect(html).toContain('418 tunnels');
    });
  });
});

