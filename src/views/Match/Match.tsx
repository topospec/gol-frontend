import _ from 'lodash'
import React, { useContext, useEffect } from 'react'
import { Heading, Button } from '@pancakeswap-libs/uikit'
import { useWeb3React } from '@web3-react/core'
import { StakeContext } from 'contexts/StakeContext'
import { LoadingContext } from 'contexts/LoadingContext'
import { AbiItem } from 'web3-utils'
import { getNonFungiblePlayerAddress, getAirNftAddress, getTrainingAddress } from 'utils/addressHelpers'
import Web3 from 'web3'
import NonFungiblePlayer from 'config/abi/NonFungiblePlayer.json'
import TrainingABI from 'config/abi/Training.json'
import Page from '../../components/Layout/Page'
import { StatisticsInfo, MatchContainer } from './components'

const web3 = new Web3(Web3.givenProvider)

const nfpContract = new web3.eth.Contract(NonFungiblePlayer.abi as AbiItem[], getNonFungiblePlayerAddress())

const Match = () => {
  const { account } = useWeb3React()
  const { initMyNFTS } = useContext(StakeContext)
  const { setLoading } = useContext(LoadingContext)

  useEffect(() => {
    if (!account) return
    async function fetchMyNFTS() {
      setLoading(true)
      const tokenIds = []
      const tmpMyTokens = []
      const nfpTokens = await nfpContract.methods.fetchMyNfts().call({ from: account })

      _.map(nfpTokens, (itm) => {
        tokenIds.push({ tokenId: itm, isAIR: false })
      })

      const myTokenHashes = []
      for (let i = 0; i < tokenIds.length; i++) {
        myTokenHashes.push(nfpContract.methods.tokenURI(tokenIds[i].tokenId).call())
      }

      const result = await Promise.all(myTokenHashes)
      for (let i = 0; i < tokenIds.length; i++) {
        if (!tmpMyTokens[i]) tmpMyTokens[i] = {}
        tmpMyTokens[i].tokenId = tokenIds[i].tokenId
        tmpMyTokens[i].tokenHash = result[i]
        tmpMyTokens[i].isAIR = tokenIds[i].isAIR
        if (!tokenIds[i].isAIR) tmpMyTokens[i].contractAddress = getNonFungiblePlayerAddress()
        else tmpMyTokens[i].contractAddress = getAirNftAddress()
      }

      initMyNFTS(tmpMyTokens)

      setLoading(false)
    }
    fetchMyNFTS()
    // eslint-disable-next-line
  }, [account])

  return (
    <Page>
      <Heading as="h1" size="lg" color="primary" mb="25px" style={{ textAlign: 'center' }}>
        <StatisticsInfo />
      </Heading>
      <MatchContainer />
    </Page>
  )
}

export default Match
