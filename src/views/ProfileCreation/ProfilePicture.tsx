import React, { useContext, useState, useMemo } from 'react'
import styled from 'styled-components'
import { AutoRenewIcon, Button, Card, CardBody, Heading, Text } from 'gol-uikit'
import { useWeb3React } from '@web3-react/core'
import { Link as RouterLink } from 'react-router-dom'
import { getPancakeProfileAddress, getNonFungiblePlayerAddress } from 'utils/addressHelpers'
import { getErc721Contract, getGolNfpsContract } from 'utils/contractHelpers'
import NonFungiblePlayer from 'config/abi/NonFungiblePlayer.json'
import { AbiItem } from 'web3-utils'
import Web3 from 'web3'
import { useTranslation } from 'contexts/Localization'
import { useUserNfts } from 'state/nftMarket/hooks'
import useToast from 'hooks/useToast'
import { useCallWithGasPrice } from 'hooks/useCallWithGasPrice'
import useFetchUserNfts from 'views/Nft/market/Profile/hooks/useFetchUserNfts'
import { nftsBaseUrl } from 'views/Nft/market/constants'
import { UserNftInitializationState } from 'state/nftMarket/types'
import { golProfilePictures } from 'config/constants/nftsCollections/golProfilePictures'
import { golIndividualProfilePicture } from 'config/constants/nftsCollections/golIndividualProfilePicture'
import { useGolNfp, useGolTeams } from 'hooks/useContract'
import SelectionCard from './SelectionCard'
import NextStepButton from './NextStepButton'
import { ProfileCreationContext } from './contexts/ProfileCreationProvider'

const Link = styled(RouterLink)`
  color: ${({ theme }) => theme.colors.primary};
`

const NftWrapper = styled.div`
  margin-bottom: 24px;
`

const web3 = new Web3(Web3.givenProvider)

const ProfilePicture: React.FC = () => {
  const { library, account } = useWeb3React()
  const [isApproved, setIsApproved] = useState(false)
  const [isApproving, setIsApproving] = useState(false)
  const [mintedNftTokenId, setMintedNftTokenId] = useState(null);
  const { selectedNft, actions } = useContext(ProfileCreationContext)

  // FIXME: NFPS Variables
  const [nfps, setNfps] = useState([])
  const [loadingNfps, setLoadingNfps] = useState(true);
  const [finishNfpLoad, setFinishNfpLoad] = useState(false);

  const nfpContract = useMemo(() => {
    return new web3.eth.Contract(NonFungiblePlayer.abi as AbiItem[], getNonFungiblePlayerAddress())
  }, [])

  console.log('userNfts: ', useUserNfts())
  // Hook to use GolNfps Contract
  const customContract = useGolNfp()
  // Defining NFPs and Nfp Initialization State
  const nfts = golProfilePictures;
  // const nfts = [];
  const userNftsInitializationState = 'INITIALIZED';

  const getBalanceOfCustomNft = async () => {
    // Function to replace the original PCS useUserNft hook
    const balanceOfResponse = await customContract.balanceOf(account);
    const balanceOf = await balanceOfResponse.toNumber();
    const nfpTokens = await nfpContract.methods.fetchMyNfts().call({ from: account })
    // console.log('my nfp tokens: ', nfpTokens)
    console.log('Balance Of GOL NFPs: ', balanceOf)
    setMintedNftTokenId(nfpTokens[0]);
  }

  // Method to get the NFP Image
  const getNfpSimpleImage = async (tokenIdUrl) => {
    const res = await fetch(tokenIdUrl)
    const json = await res.json()
    // console.log('full json ', json)
    const imageUrl = json.image
    return (imageUrl)
  }

  // Method to get the User Nfp Balance
  const getBalanceOfUserNfp = async () => {
    // Function to replace the original PCS useUserNft hook
    if (loadingNfps) {

      const nfpTokens = await nfpContract.methods.fetchMyNfts().call({ from: account })
      // console.log('nfpTokens: ', nfpTokens)
      const profilePicturesFromNfps = [];

      for (let i = 0; i < nfpTokens.length; i++) {
        profilePicturesFromNfps.push(nfpContract.methods.getTokenFullURI(nfpTokens[i]).call())
      }

      const result = await Promise.all(profilePicturesFromNfps)

      const images = [];

      for (let i = 0; i < result.length; i++) {
        images.push(getNfpSimpleImage(result[i]))
      }

      // FIXME: Getting Images from each User NFP
      const imagesResult = await Promise.all(images)
      // console.log('IMAGES LINKS: ', imagesResult)

      const finishedArray = [];
      for (let i = 0; i < imagesResult.length; i++) {
        // FIXME: Getting token id from Image URL. In future versions must change
        const nfpTokenId = (imagesResult[i].slice(-7)).split('.')[0];
        const thisProfilePicture = {
          "tokenId": nfpTokenId,
          "name": `NonFungiblePlayer #${nfpTokenId}`,
          "description": "NonFungiblePlayer",
          "collectionName": "Non Fungible Player",
          "collectionAddress": "0xC12100771bCcae1f8b87598c6449f041E46a1Ef9",
          "image": {
            "original": imagesResult[i].replace("ipfs://", "https://ipfs.io/ipfs/"),
            "thumbnail": imagesResult[i].replace("ipfs://", "https://ipfs.io/ipfs/"),
            "mp4": null,
            "webm": null,
            "gif": null
          },
          "attributes": [],
          "collection": {
            "name": "Gol NFPs"
          }
        }
        finishedArray.push(thisProfilePicture);
      }

      // FIXME: finishedArray is now the Full Array with NFPs Info.

      if (finishedArray.length > 0) {
        setNfps(finishedArray);
        setLoadingNfps(false);
      }

    } else {
      // FIXME: Not fetching more nfps
      console.log('NFPs AlreadyFetched.')
    }

  }

  // Method to check if user has NFPs in his wallet @dev:topospec
  getBalanceOfUserNfp()

  // Replaces original NFT API Call from PCS @dev:topospec
  getBalanceOfCustomNft();

  useFetchUserNfts(account)

  const { t } = useTranslation()
  const { toastError, toastSuccess } = useToast()
  const { callWithGasPrice } = useCallWithGasPrice()

  const handleApprove = async () => {
    console.log('Approving...')

    const contract = getGolNfpsContract(selectedNft.collectionAddress, library.getSigner())
    const tx = await callWithGasPrice(contract, 'approve', [getPancakeProfileAddress(), selectedNft.tokenId])

    setIsApproving(true)
    const receipt = await tx.wait()
    if (receipt.status) {
      toastSuccess(t('Enabled'), t('Please progress to the next step.'))
      setIsApproving(false)
      setIsApproved(true)
    } else {
      toastError(t('Error'), t('Please try again. Confirm the transaction and make sure you are paying enough gas!'))
      setIsApproving(false)
    }
  }

  if (nfts.length === 0 && userNftsInitializationState === UserNftInitializationState.INITIALIZED) {
    return (
      <>
        <Heading scale="xl" mb="24px">
          {t('Oops!')}
        </Heading>
        <Text bold fontSize="20px" mb="24px">
          {t('We couldn???t find any Pancake Collectibles in your wallet.')}
        </Text>
        <Text as="p">
          {t(
            'You need a Pancake Collectible to finish setting up your profile. If you sold or transferred your starter collectible to another wallet, you???ll need to get it back or acquire a new one somehow. You can???t make a new starter with this wallet address.',
          )}
        </Text>
      </>
    )
  }

  return (
    <>
      <Text fontSize="20px" color="textSubtle" bold>
        {t('Step %num%', { num: 2 })}
      </Text>
      <Heading as="h3" scale="xl" mb="24px">
        {t('Set Profile Picture')}
      </Heading>
      <Card mb="24px">
        <CardBody>
          <Heading as="h4" scale="lg" mb="8px">
            {/* {t('Choose collectible')} */}
            Choose your NFP
          </Heading>
          <Text as="p" color="textSubtle">
            {/* {t('Choose a profile picture from the eligible collectibles (NFT) in your wallet, shown below.')} */}
            Choose a profile picture from the eligible collectibles (NFPs) in your wallet, shown below.
          </Text>
          <Text as="p" color="textSubtle" mb="24px">
            {/* {t('Only approved Pancake Collectibles can be used.')} */}
            Only approved Gol NFPs can be used.
            <Link to={`${nftsBaseUrl}/collections`} style={{ marginLeft: '4px' }}>
              {t('See the list >')}
            </Link>
          </Text>
          <NftWrapper>
            {/* {nfts.map((walletNft) => {
              const firstTokenId = nfts[0].tokenId
              return (
                <SelectionCard
                  name="profilePicture"
                  key={walletNft.tokenId}
                  value={firstTokenId}
                  image={walletNft.image.thumbnail}
                  isChecked={firstTokenId === selectedNft.tokenId}
                  onChange={(value: string) => actions.setSelectedNft(value, walletNft.collectionAddress)}
                // onChange={(value: string) => console.log('picked: ', value)}
                >
                  <Text bold>{walletNft.name}</Text>
                </SelectionCard>
              )
            })} */}

            {/* Refactor of previous function */}
            {loadingNfps ? <></> : <>
              {nfps.map((walletNft) => {
                const firstTokenId = nfps[0].tokenId;
                return (
                  <SelectionCard
                    name="profilePicture"
                    key={walletNft.tokenId}
                    value={walletNft.tokenId}
                    image={walletNft.image.thumbnail}
                    isChecked={walletNft.tokenId === selectedNft.tokenId}
                    // FIXME: Small Changes on Picture Selection @dev:topospec
                    onChange={(value: string) => {
                      actions.setSelectedNft(value, walletNft.collectionAddress)
                    }}
                  >
                    <Text bold>{walletNft.name}</Text>
                  </SelectionCard>
                )
              })}
            </>}
          </NftWrapper>
          <Heading as="h4" scale="lg" mb="8px">
            {t('Allow collectible to be locked')}
          </Heading>
          <Text as="p" color="textSubtle" mb="16px">
            {t(
              "The collectible you've chosen will be locked in a smart contract while it???s being used as your profile picture. Don't worry - you'll be able to get it back at any time.",
            )}
          </Text>
          <Button
            isLoading={isApproving}
            disabled={isApproved || isApproving || selectedNft.tokenId === null}
            onClick={handleApprove}
            endIcon={isApproving ? <AutoRenewIcon spin color="currentColor" /> : undefined}
            id="approveStarterCollectible"
          >
            {t('Enable')}
          </Button>
        </CardBody>
      </Card>
      <NextStepButton onClick={actions.nextStep} disabled={selectedNft.tokenId === null || !isApproved || isApproving}>
        {t('Next Step')}
      </NextStepButton>
    </>
  )
}

export default ProfilePicture
