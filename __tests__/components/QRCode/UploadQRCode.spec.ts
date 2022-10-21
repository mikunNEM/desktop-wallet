/*
 * (C) Symbol Contributors 2022
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and limitations under the License.
 *
 */
import UploadQRCode from '@/components/QRCode/UploadQRCode/UploadQRCode.vue';
import UploadQRCodeTs from '@/components/QRCode/UploadQRCode/UploadQRCodeTs';
import { getComponent } from '@MOCKS/Components';
import { QRCodeType } from 'symbol-qr-library';
import { networkMock } from '@MOCKS/network';

describe('components/QRCode/UploadQRCode', () => {
    const getUploadQRCodeWrapper = (state = {}, props = {}) => {
        const StubComponent = {
            template: '<div><slot /></div>',
        };

        const networkStore = {
            namespaced: true,
            state: { feesConfig: undefined },
            getters: {
                feesConfig: (state) => {
                    return state.feesConfig;
                },
            },
        };

        return getComponent(
            UploadQRCode,
            {
                network: networkStore,
            },
            {
                ...state,
            },
            {
                validQrTypes: [
                    QRCodeType.AddContact,
                    QRCodeType.RequestTransaction,
                    QRCodeType.SignedTransaction,
                    QRCodeType.CosignatureSignedTransaction,
                ],
                ...props,
            },
            {
                Tabs: true,
                TabPane: true,
                Upload: true,
                Icon: true,
            },
        );
    };

    describe('onDecode', () => {
        const stringJson = `{"v":3,"type":${QRCodeType.AddContact},"network_id":152,"chain_id":"1234567","data":{"payload":"00"}}`;

        it('dispatch network/LOAD_TRANSACTION_FEES when fees config is undefined', () => {
            // Arrange:
            const wrapper = getUploadQRCodeWrapper({}, {});

            const vm = wrapper.vm as UploadQRCodeTs;

            // Act:
            vm.onDecode(stringJson);

            // Assert:
            expect(vm.$store.dispatch).toHaveBeenCalledWith('network/LOAD_TRANSACTION_FEES');
        });

        it('set invalidType true when invalid qr types provided with fees config is defined', () => {
            // Arrange:
            const wrapper = getUploadQRCodeWrapper(
                {
                    feesConfig: networkMock.fees,
                },
                {
                    validQrTypes: [QRCodeType.CosignatureSignedTransaction],
                },
            );

            const vm = wrapper.vm as UploadQRCodeTs;

            wrapper.setData({
                invalidType: false,
            });

            // Act:
            vm.onDecode(stringJson);

            // Assert:
            expect(vm.$store.dispatch).not.toHaveBeenCalledWith('network/LOAD_TRANSACTION_FEES');
            expect(wrapper.emitted('uploadComplete')).toEqual(undefined);
            expect(vm.invalidType).toBe(true);
        });

        it('emits uploadComplete when valid qr types provided with fees config is defined', () => {
            // Arrange:
            const wrapper = getUploadQRCodeWrapper(
                {
                    feesConfig: networkMock.fees,
                },
                {
                    validQrTypes: [QRCodeType.AddContact],
                },
            );

            const vm = wrapper.vm as UploadQRCodeTs;

            // Act:
            vm.onDecode(stringJson);

            // Assert:
            expect(vm.$store.dispatch).not.toHaveBeenCalledWith('network/LOAD_TRANSACTION_FEES');
            expect(wrapper.emitted('uploadComplete')).toEqual([[stringJson]]);
            expect(vm.invalidType).toBe(false);
        });
    });

    describe('onTabClick', () => {
        const runBasicOnTabClickTests = (name, expectResult) => {
            it(`set scanActive to ${expectResult} when name is ${name}`, async () => {
                // Arrange:
                const wrapper = getUploadQRCodeWrapper(
                    {},
                    {
                        scanActive: !expectResult,
                    },
                );
                const vm = wrapper.vm as UploadQRCodeTs;

                // Act:
                vm.onTabClick(name);

                // Assert:
                expect(vm.scanActive).toBe(expectResult);
            });
        };

        runBasicOnTabClickTests('scan', true);
        runBasicOnTabClickTests('upload', false);
    });

    describe('onBeforeUpload', () => {
        it('process image qr and pass data to qrcodeCapture', () => {
            // Arrange:
            const wrapper = getUploadQRCodeWrapper({}, {});
            const vm = wrapper.vm as UploadQRCodeTs;

            wrapper.setData({
                invalidType: true,
            });

            vm.$refs.qrcodeCapture.onChangeInput = jest.fn();

            const fileReaderSpy = jest.spyOn(FileReader.prototype, 'readAsDataURL').mockImplementation(() => null);

            const file = {
                name: 'invoice_qr.png',
                size: 50000,
                type: 'image/png',
            };

            // Act:
            vm.onBeforeUpload(file);

            // Assert:
            expect(vm.invalidType).toBe(false);
            expect(vm.imageFileName).toBe('invoice_qr.png');
            expect(vm.$refs.qrcodeCapture.onChangeInput).toHaveBeenCalledWith({
                target: {
                    files: [file],
                },
            });
            expect(fileReaderSpy).toHaveBeenCalledWith(file);
        });
    });
});
